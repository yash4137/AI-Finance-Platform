import { Outlet } from "react-router-dom";
const BaseLayout = () => {
  return <div className="flex flex-col w-full h-auto">
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-full mx-auto h-auto ">
          <Outlet />
        </div>
      </div>
    </div>;
};
var stdin_default = BaseLayout;
export {
  stdin_default as default
};
