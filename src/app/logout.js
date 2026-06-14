import axios from "axios";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

const Logout = () => {
    const router = useRouter();


    const handleLogOut = async () => {
        try {
            localStorage.clear();
            router.push('/');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }

    return (
        <button
            onClick={handleLogOut}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
        >
            <LogOut size={15} />
            Logout
        </button>
    )
}

export default Logout;
