import React from "react";
import { Zap } from "../../assets/icons/Zap";
import { useSiteConfig } from "../../context/SiteConfigContext";

const Loader = ({ fullScreen = false }) => {
    const { brandName } = useSiteConfig();
    if (fullScreen) {
        return (
            <div className="h-full fixed inset-0 bg-white dark:glass-card z-[9999] flex flex-col items-center justify-center">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-zoop-canvas rounded-full"></div>
                    <div className="absolute inset-0 w-16 h-16 border-4 border-zoop-moss border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                        <Zap width={20} height={20} fill="#b7e84b" />
                    </div>
                </div>
                <h3 className="mt-8 text-xl font-900 tracking-tighter text-zoop-obsidian dark:text-white animate-pulse">
                    {brandName}
                </h3>
                <p className="text-xs font-bold text-gray-400 mt-2 tracking-widest uppercase">
                    Fetching inventory...
                </p>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center p-8">
            <div className="w-8 h-8 border-2 border-zoop-moss border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
};

export default Loader;
