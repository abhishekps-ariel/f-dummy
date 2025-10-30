import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { performExitImpersonation } from '../../services/authService';
import { getImpersonationState, setImpersonationState } from '../../utils/storage';
import { ROUTES } from '../../constants/routerConstants';

const bannerStyle = {
  background: '#fff3cd',
  border: '1px solid #ffeeba',
  color: '#856404',
  padding: '8px 12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
};

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
    } catch (e) {
      toast.error(e?.message || 'Failed to exit impersonation');
    }
  }, []);

  if (!isImpersonating) return null;

  return (
    <div style={bannerStyle}>
      <div>
        <strong>Impersonating</strong>: {impersonatedUserName || 'User'}
      </div>
      <button className="btn btn-sm btn-outline-dark" onClick={exit}>
        Exit impersonation
      </button>
    </div>
  );
}

export default ImpersonationBanner;


