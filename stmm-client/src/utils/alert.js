import i18n from '../i18n';
import Swal from 'sweetalert2';

export const showSuccess = (title, text = '') => {
    return Swal.fire({
        icon: 'success',
        title: title || i18n.t('alert.success'),
        text: text,
        confirmButtonColor: '#10b981',
        confirmButtonText: i18n.t('alert.close'),
    });
};

export const showError = (title, text = '') => {
    return Swal.fire({
        icon: 'error',
        title: title || i18n.t('alert.failure'),
        text: text,
        confirmButtonColor: '#ef4444',
        confirmButtonText: i18n.t('alert.close'),
    });
};

export const showWarning = (title, text = '') => {
    return Swal.fire({
        icon: 'warning',
        title: title || i18n.t('alert.warning'),
        text: text,
        confirmButtonColor: '#f59e0b',
        confirmButtonText: i18n.t('alert.close'),
    });
};

export const showConfirm = (title, text) => {
    return Swal.fire({
        title: title || i18n.t('alert.confirm'),
        text: text || i18n.t('alert.are_you_sure_you'),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#6b7280',
        confirmButtonText: i18n.t('alert.agree'),
        cancelButtonText: i18n.t('alert.cancel')
    });
};
