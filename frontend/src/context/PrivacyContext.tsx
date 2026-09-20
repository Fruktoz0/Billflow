import React, { createContext, useContext, useEffect, useState } from 'react';

interface PrivacyContextType {
  isPrivate: boolean;
  togglePrivacy: () => void;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export const PrivacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPrivate, setIsPrivate] = useState<boolean>(() => {
    return localStorage.getItem('billflow_privacy') === 'true';
  });

  useEffect(() => {
    if (isPrivate) {
      document.body.classList.add('privacy-active');
    } else {
      document.body.classList.remove('privacy-active');
    }
    localStorage.setItem('billflow_privacy', String(isPrivate));
  }, [isPrivate]);

  // Keyboard shortcut: 'P' to toggle privacy mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) {
        return;
      }

      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setIsPrivate((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const togglePrivacy = () => {
    setIsPrivate((prev) => !prev);
  };

  return (
    <PrivacyContext.Provider value={{ isPrivate, togglePrivacy }}>
      {children}
    </PrivacyContext.Provider>
  );
};

export const usePrivacy = () => {
  const context = useContext(PrivacyContext);
  if (!context) throw new Error('usePrivacy must be used within a PrivacyProvider');
  return context;
};
