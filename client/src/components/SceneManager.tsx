import { useState } from "react";
import { IoIosBookmark, IoMdClose } from "react-icons/io";

export default function SceneManager() {
    const [hidden, setHidden] = useState(true);

    return (
        <div className="bg-white rounded p-4 shadow-lg overflow-auto text-slate-600 text-sm">
            {hidden && (
                <div className="flex">
                    <button onClick={() => setHidden(false)}><IoIosBookmark size={24} /></button>
                </div>
            )}
            {!hidden && (
                <div className="flex flex-row items-center justify-between">
                    <div className="font-bold">In View Predictions</div>
                    <button
                        className="hover:rotate-90 hover:scale-110 transition-transform hover:cursor-pointer hover:text-red-600"
                        onClick={() => setHidden(true)}
                    >
                        <IoMdClose size={24} />
                    </button>
                </div>
            )}
        </div>
    )
}