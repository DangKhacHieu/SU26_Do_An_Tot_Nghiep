using AutoMapper;
using FluentValidation;
using STMM.Business.DTOs.Content;
using STMM.Business.Exceptions;
using STMM.Business.Interfaces;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.Business.Services
{
    public class ContentService : IContentService
    {
        private readonly INotificationRepository _notificationRepository;
        private readonly IUserRepository _userRepository;
        private readonly IMapper _mapper;
        private readonly IValidator<CreateContentRequest> _createValidator;
        private readonly IValidator<UpdateContentRequest> _updateValidator;

        public ContentService(
            INotificationRepository notificationRepository,
            IUserRepository userRepository,
            IMapper mapper,
            IValidator<CreateContentRequest> createValidator,
            IValidator<UpdateContentRequest> updateValidator)
        {
            _notificationRepository = notificationRepository;
            _userRepository = userRepository;
            _mapper = mapper;
            _createValidator = createValidator;
            _updateValidator = updateValidator;
        }

        public async Task<IEnumerable<ContentDto>> GetContentsAsync(string? type, string? targetRole, CancellationToken ct = default)
        {
            var results = await _notificationRepository.GetNotificationsAsync(type, targetRole, ct);
            return _mapper.Map<IEnumerable<ContentDto>>(results);
        }

        public async Task<ContentDto> GetContentByIdAsync(int id, CancellationToken ct = default)
        {
            var content = await _notificationRepository.GetNotificationWithUserByIdAsync(id, ct);

            if (content == null)
            {
                throw new NotFoundException($"Notification with ID {id} was not found.");
            }

            return _mapper.Map<ContentDto>(content);
        }

        public async Task<ContentDto> CreateContentAsync(CreateContentRequest request, CancellationToken ct = default)
        {
            var valResult = await _createValidator.ValidateAsync(request, ct);
            if (!valResult.IsValid)
            {
                throw new BadRequestException(string.Join("; ", valResult.Errors.Select(e => e.ErrorMessage)));
            }

            int creatorId = request.CreatedByUserId ?? 0;
            if (creatorId <= 0)
            {
                var managerUser = await _userRepository.GetFirstManagerOrAdminAsync(ct);
                creatorId = managerUser?.UserId ?? 1;
            }

            var targetUserIds = request.TargetUserIds?
                .Where(userId => userId > 0)
                .Distinct()
                .ToList() ?? new List<int>();

            if (request.TargetUserId is > 0)
            {
                targetUserIds.Add(request.TargetUserId.Value);
            }

            if (targetUserIds.Count == 0 && !string.IsNullOrWhiteSpace(request.TargetRole))
            {
                var recipients = await _userRepository.GetActiveUsersByRoleAsync(request.TargetRole, ct);
                targetUserIds.AddRange(recipients.Select(user => user.UserId));
            }

            targetUserIds = targetUserIds.Distinct().ToList();
            if (targetUserIds.Count == 0)
            {
                throw new BadRequestException("At least one active recipient is required.");
            }

            Notification lastNotification = null!;
            foreach (var userId in targetUserIds)
            {
                var notification = new Notification
                {
                    Title = request.Title,
                    Content = request.Content,
                    NotiType = request.NotiType ?? "Announcement",
                    TargetRole = null,
                    TargetUserId = userId,
                    CreatedByUserId = creatorId,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };
                await _notificationRepository.AddAsync(notification, ct);
                lastNotification = notification;
            }
            await _notificationRepository.SaveChangesAsync(ct);

            if (lastNotification.TargetUserId.HasValue)
            {
                lastNotification.TargetUser = await _userRepository.GetByIdAsync(lastNotification.TargetUserId.Value, ct);
            }

            return _mapper.Map<ContentDto>(lastNotification);
        }

        public async Task<ContentDto> UpdateContentAsync(int id, UpdateContentRequest request, CancellationToken ct = default)
        {
            var valResult = await _updateValidator.ValidateAsync(request, ct);
            if (!valResult.IsValid)
            {
                throw new BadRequestException(string.Join("; ", valResult.Errors.Select(e => e.ErrorMessage)));
            }

            var notification = await _notificationRepository.GetNotificationWithUserByIdAsync(id, ct);

            if (notification == null)
            {
                throw new NotFoundException($"Notification with ID {id} was not found.");
            }

            notification.Title = request.Title;
            notification.Content = request.Content;
            notification.NotiType = request.NotiType ?? "Article";
            notification.TargetRole = request.TargetRole;
            notification.TargetUserId = request.TargetUserId;

            _notificationRepository.Update(notification);
            await _notificationRepository.SaveChangesAsync(ct);

            if (notification.TargetUserId.HasValue)
            {
                notification.TargetUser = await _userRepository.GetByIdAsync(notification.TargetUserId.Value, ct);
            }

            return _mapper.Map<ContentDto>(notification);
        }

        public async Task<bool> DeleteContentAsync(int id, CancellationToken ct = default)
        {
            var notification = await _notificationRepository.GetByIdAsync(id, ct);

            if (notification == null)
            {
                throw new NotFoundException($"Notification with ID {id} was not found.");
            }

            _notificationRepository.Delete(notification);
            var result = await _notificationRepository.SaveChangesAsync(ct);
            return result > 0;
        }
    }
}
