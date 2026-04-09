import { useState } from "react";
import { IoIosBookmark, IoMdClose } from "react-icons/io";

export default function SceneManager() {
    const [hidden, setHidden] = useState(true);

    return (
        // Removed 'absolute', 'top-5', 'right-20'
        <div className="bg-white rounded p-4 shadow-lg overflow-auto text-slate-600 text-sm">
            {/* ... rest of your existing logic remains exactly the same ... */}
            {hidden && (
                <div className="flex">
                    <button onClick={() => setHidden(false)}><IoIosBookmark size={24} /></button>
                </div>
            )}
            {!hidden && (
                <div className="flex flex-col">
                    <button onClick={() => setHidden(true)}><IoMdClose size={24} /></button>
                    <p className="text-xs text-gray-500 mt-2">In-view predictions</p>
                </div>
            )}
        </div>
    )
}