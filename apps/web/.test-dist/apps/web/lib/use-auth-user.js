"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuthUser = useAuthUser;
const react_1 = require("react");
function useAuthUser() {
    const [user, setUser] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        function syncUser() {
            try {
                const raw = window.localStorage.getItem("tsmt.user");
                if (!raw) {
                    setUser(null);
                    return;
                }
                setUser(JSON.parse(raw));
            }
            catch {
                setUser(null);
            }
        }
        function handleStorage(event) {
            if (!event.key || event.key === "tsmt.user") {
                syncUser();
            }
        }
        function handleAuthChanged() {
            syncUser();
        }
        syncUser();
        window.addEventListener("storage", handleStorage);
        window.addEventListener("tsmt-auth-changed", handleAuthChanged);
        return () => {
            window.removeEventListener("storage", handleStorage);
            window.removeEventListener("tsmt-auth-changed", handleAuthChanged);
        };
    }, []);
    return user;
}
