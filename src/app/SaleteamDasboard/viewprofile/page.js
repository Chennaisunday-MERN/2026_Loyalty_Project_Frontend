"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { Mail, User, File as FileIcon, FileText, IdCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageShell, PageHeader, Card, Field, SecondaryButton } from "../../_components/ui";

const ProfileView = () => {
    const [Eid, setEid] = useState("");
    const [role, setRole] = useState("");
    const [token, setToken] = useState("");
    const [profileData, setProfileData] = useState({
        name: "",
        email: "",
        Fileupload: "",
        profileimg: "",
    });

    const router = useRouter();

    useEffect(() => {
        // Load data from localStorage after component mounts
        const storedId = localStorage.getItem("idstore");
        const storedRole = localStorage.getItem("rolestore");
        const storedToken = localStorage.getItem("admintokens");

        setEid(storedId);
        setRole(storedRole);
        setToken(storedToken);

        if (!storedToken) {
            alert("No token found. Please login as an admin.");
            return;
        }

        if (storedId) {
            axios
                .get(`http://localhost:5005/api/commonprofile/${storedId}`, {
                    headers: {
                        Authorization: `Bearer ${storedToken}`,
                        "Content-Type": "multipart/form-data",
                    },
                })
                .then((response) => {
                    if (response.data && response.data.data) {
                        const fileUrl = response.data.fileUrl;
                        setProfileData({
                            name: response.data.data.name,
                            email: response.data.data.email,
                            Fileupload: fileUrl,
                            profileimg: response.data.data.profileimg,
                        });
                    } else {
                        console.error("Unexpected response data:", response);
                    }
                })
                .catch((error) => {
                    console.error("Error fetching profile data:", error);
                });
        }
    }, []);

    const fileUploadUrl = profileData.Fileupload
        ? `http://localhost:5005/api/uploads/${profileData.profileimg}`
        : "";

    const handleBackClick = () => {
        const role = localStorage.getItem("role")?.trim().toLowerCase();

        if (role === "service engineer" || role === "engineer") {
            router.push("/ServiceProject/Dasboard");
        } else {
            router.push("/SaleteamDasboard/Dasboard");
        }
    };

    return (
        <PageShell>
            <PageHeader
                eyebrow="Account"
                title="My Profile"
                subtitle="Your account details and uploaded documents."
                onBack={handleBackClick}
            />

            <Card className="mx-auto max-w-2xl">
                <div className="flex flex-col items-center gap-3 border-b border-slate-100 pb-6">
                    {profileData.profileimg ? (
                        <img
                            src={fileUploadUrl}
                            alt="Profile"
                            className="h-28 w-28 rounded-full border-4 border-blue-100 object-cover shadow-sm"
                        />
                    ) : (
                        <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-blue-100 bg-blue-50 text-blue-500">
                            <User size={40} />
                        </div>
                    )}
                    <div className="text-center">
                        <p className="text-lg font-semibold text-slate-900">{profileData.name || "—"}</p>
                        <p className="text-sm text-slate-500">{role || "Sales"}</p>
                    </div>
                </div>

                <div className="mt-6 space-y-4">
                    <Field label="Employee ID" icon={IdCard}>{Eid || "—"}</Field>
                    <Field label="Name" icon={User}>{profileData.name || "—"}</Field>
                    <Field label="Email" icon={Mail}>{profileData.email || "—"}</Field>

                    {fileUploadUrl && (
                        <Field label="Uploaded Document" icon={FileIcon}>
                            <a
                                href={fileUploadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 font-semibold text-blue-700 hover:text-blue-800"
                            >
                                <FileText size={15} />
                                View Uploaded File
                            </a>
                        </Field>
                    )}
                </div>
            </Card>
        </PageShell>
    );
};

export default ProfileView;
