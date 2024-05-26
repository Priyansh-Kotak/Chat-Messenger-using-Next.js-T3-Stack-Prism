// import type { PropsWithChildren } from "react";

// export const PageLayout = {props: PropsWithChildren} => {
// return(

//     <main className="flex h-screen justify-center ">
//     <div className="h-full w-full border-x border-slate-400 md:max-h-full  md:max-w-2xl md:overflow-scroll">
//       <div className="sticky top-0  flex w-full border-b border-slate-400 bg-black p-4">
//         {props.children}
//       </div>

//         </div>
//       </main>
// );
// };

import type { PropsWithChildren } from "react";

export const PageLayout = (props: PropsWithChildren) => {
  return (
    <main className="flex h-screen bg-white justify-center ">
      <div className=" justify-center flex w-full border-b  border-slate-400 bg-black p-4">
        {props.children}
      </div>
    </main>
  );
};
