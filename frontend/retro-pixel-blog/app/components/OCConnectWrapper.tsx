'use client';

import { ReactNode } from 'react';
import { OCConnect } from '@opencampus/ocid-connect-js';

interface OCConnectWrapperProps {
  children: ReactNode;
  opts: {
    clientId: string;
    redirectUri: string;
    referralCode: string;
  };
  sandboxMode: boolean;
}

export default function OCConnectWrapper({ children, opts, sandboxMode }: OCConnectWrapperProps) {
  return (
    <OCConnect opts={opts} sandboxMode={sandboxMode}>
      {children}
    </OCConnect>
  );
} 