export  interface MenuItem {
  title: string;
  key: string;
  path?: string;
  icon?: React.ReactNode;
  subMenu?: string[];
}