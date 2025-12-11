import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { performExitImpersonation } from '../../services/authService';
import { getImpersonationState, setImpersonationState } from '../../utils/storage';
import { ROUTES } from '../../constants/routerConstants';
import './ImpersonationBanner.css';

function ImpersonationBanner() {
  const { t } = useTranslation();
  const [{ isImpersonating, impersonatedUserName }, setState] = useState(getImpersonationState());

  useEffect(() => {
    const onStorage = () => setState(getImpersonationState());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const exit = useCallback(async () => {
    try {
      const result = await performExitImpersonation();
      if (result.isSuccess) {
        toast.success(t('errors.exitedImpersonation'));
        window.location.replace(ROUTES.LOGIN);
      } else {
        toast.error(result.msg || t('errors.failedExitImpersonation'));
      }
    } catch (err) {
      toast.error(err?.message || t('errors.failedExitImpersonation'));
    }
  }, []);

  if (!isImpersonating) return null;

  return (
    <div className="impersonation-banner">
      <div>
        <strong>Impersonating</strong>: {impersonatedUserName || 'User'}
      </div>
      <button 
        className="dashboard-btn-refresh" 
        onClick={exit}
      >
        Exit impersonation
      </button>
    </div>
  );
}

export default ImpersonationBanner;


