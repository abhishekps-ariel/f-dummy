import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { performExitImpersonation } from '../../services/authService';
import { getImpersonationState, setImpersonationState } from '../../utils/storage';
import { ROUTES } from '../../constants/routerConstants';
import './ImpersonationBanner.css';

function ImpersonationBanner() {
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
        toast.success('Exited impersonation');
        window.location.replace(ROUTES.LOGIN);
      } else {
        toast.error(result.msg || 'Failed to exit impersonation');
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to exit impersonation');
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


