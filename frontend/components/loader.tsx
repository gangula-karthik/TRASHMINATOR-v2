import "../style/loader.css";

interface LoaderProps {
  children: React.ReactNode;
}

const Loader: React.FC<LoaderProps> = ({ children, ...props }) => {
  return (
    <div className="wrapper" {...props}>
      <div className="spinner"></div>
      <p>{children}</p>
    </div>
  );
};

export default Loader;
