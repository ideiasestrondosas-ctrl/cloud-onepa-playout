import React, { createContext, useContext, useState } from 'react';

const HelpContext = createContext();

export function HelpProvider({ children }) {
  const [helpMode, setHelpMode] = useState(false);
  const [helpContent, setHelpContent] = useState(null);

  const toggleHelpMode = () => setHelpMode(!helpMode);

  const showHelp = (title, content, guideRef = null) => {
    setHelpContent({ title, content, guideRef });
  };

  const closeHelp = () => setHelpContent(null);

  return (
    <HelpContext.Provider value={{ helpMode, toggleHelpMode, helpContent, showHelp, closeHelp }}>
      {children}
    </HelpContext.Provider>
  );
}

export function useHelp() {
  return useContext(HelpContext);
}
