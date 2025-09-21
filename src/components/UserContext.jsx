import { createContext, useState, useContext } from 'react';

const UserContext = createContext();
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loginStatus, setLoginStatus] = useState(false);

  return (
    <UserContext.Provider value={{ user, setUser, loginStatus, setLoginStatus }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserData = () => {
  return useContext(UserContext);
};
