'use client';

import { LoginCallBack, useOCAuth } from '@opencampus/ocid-connect-js';
import { useRouter } from 'next/navigation';

function CustomErrorComponent() {
  const { authState } = useOCAuth();
  return (
    <div className="text-red-500">
      登录错误: {authState.error?.message}
    </div>
  );
}

function CustomLoadingComponent() {
  return <div>加载中...</div>;
}

export default function RedirectPage() {
  const router = useRouter();

  const loginSuccess = () => {
    router.push('/');
  };

  const loginError = (error: Error) => {
    console.error('登录错误:', error);
  };

  return (
    <LoginCallBack 
      errorCallback={loginError} 
      successCallback={loginSuccess}
      customErrorComponent={CustomErrorComponent}
      customLoadingComponent={CustomLoadingComponent}
    />
  );
} 