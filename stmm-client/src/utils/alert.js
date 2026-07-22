import Swal from 'sweetalert2';

export const showSuccess = (title = 'Thành công', text = '') => {
    return Swal.fire({
        icon: 'success',
        title: title,
        text: text,
        confirmButtonColor: '#10b981',
        confirmButtonText: 'Đóng',
    });
};

export const showError = (title = 'Thất bại', text = '') => {
    return Swal.fire({
        icon: 'error',
        title: title,
        text: text,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Đóng',
    });
};

export const showWarning = (title = 'Cảnh báo', text = '') => {
    return Swal.fire({
        icon: 'warning',
        title: title,
        text: text,
        confirmButtonColor: '#f59e0b',
        confirmButtonText: 'Đóng',
    });
};

export const showConfirm = (title = 'Xác nhận', text = 'Bạn có chắc chắn muốn thực hiện hành động này?') => {
    return Swal.fire({
        title: title,
        text: text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Đồng ý',
        cancelButtonText: 'Hủy'
    });
};
