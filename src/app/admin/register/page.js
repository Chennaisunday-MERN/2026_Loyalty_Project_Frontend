"use client";

import axios from "axios";
import React, { useRef, useState } from "react";
import {
  AdminPanel,
  AdminShell,
  adminInputClass,
  adminPrimaryButtonClass,
  adminSecondaryButtonClass,
} from "../_components/AdminShell";

const emptyUser = {
  name: "",
  email: "",
  password: "",
  role: "",
  JOD: "",
  contactnumber: "",
  address: "",
  Currentsalary: "",
  Remarks: "",
  EOD: "",
  Fileupload: null,
  profileimg: null,
};

const roles = [
  "sales head",
  "Engineer",
  "Service Engineer",
  "Sales Employee",
  "Inventory Manager",
  "Lead filler",
  "Stock Filler",
];

const CommonRegi = () => {
  const [user, setUser] = useState(emptyUser);
  const [companyResources, setCompanyResources] = useState([]);
  const fileInputRef = useRef(null);
  const profileImgInputRef = useRef(null);

  const handleAddResource = () => {
    setCompanyResources([...companyResources, { Thingsname: "", productnumber: "", givenStatus: "" }]);
  };

  const handleResourceChange = (index, field, value) => {
    const newResources = [...companyResources];
    newResources[index][field] = value;
    setCompanyResources(newResources);
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setUser((prev) => ({
      ...prev,
      [name]: files[0],
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, email, password, role, JOD, contactnumber } = user;

    if (!name || !email || !password || !role || !JOD || !contactnumber) {
      alert("All required fields must be filled.");
      return;
    }

    const token = localStorage.getItem("admintokens");
    if (!token) {
      alert("No token found. Please login as an admin.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("role", role);
      formData.append("JOD", JOD);
      formData.append("contactnumber", contactnumber);
      formData.append("address", user.address);
      formData.append("Currentsalary", user.Currentsalary);
      formData.append("Remarks", user.Remarks);
      formData.append("EOD", user.EOD);

      companyResources.forEach((resource, index) => {
        formData.append(`CompanyResources[${index}][Thingsname]`, resource.Thingsname);
        formData.append(`CompanyResources[${index}][productnumber]`, resource.productnumber);
        formData.append(`CompanyResources[${index}][givenStatus]`, resource.givenStatus);
      });

      if (user.Fileupload) formData.append("Fileupload", user.Fileupload);
      if (user.profileimg) formData.append("profileimg", user.profileimg);

      const response = await axios.post("http://localhost:5005/api/registration", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Registration successful");
      console.log("Successfully registered", response.data);

      setUser(emptyUser);
      setCompanyResources([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (profileImgInputRef.current) profileImgInputRef.current.value = "";
    } catch (err) {
      console.error("Error:", err.response ? err.response.data : err.message);
      alert(`Error: ${err.response?.data?.message || "An error occurred."}`);
    }
  };

  return (
    <AdminShell title="Add Employee" subtitle="Create an employee profile, assign a role, and record issued company resources.">
      <form onSubmit={handleSubmit} className="space-y-6">
        <AdminPanel title="Employee Details" subtitle="Required employee identity and access information.">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name" required>
              <input name="name" placeholder="Employee name" value={user.name} onChange={handleChange} required className={adminInputClass} />
            </Field>
            <Field label="Email" required>
              <input name="email" type="email" placeholder="employee@company.com" value={user.email} onChange={handleChange} required className={adminInputClass} />
            </Field>
            <Field label="Password" required>
              <input name="password" type="password" placeholder="Temporary password" value={user.password} onChange={handleChange} required className={adminInputClass} />
            </Field>
            <Field label="Role" required>
              <select name="role" value={user.role} onChange={handleChange} required className={adminInputClass}>
                <option value="">Choose role</option>
                {roles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </Field>
            <Field label="Joining Date" required>
              <input type="date" name="JOD" value={user.JOD} onChange={handleChange} required className={adminInputClass} />
            </Field>
            <Field label="Contact Number" required>
              <input name="contactnumber" placeholder="Mobile number" value={user.contactnumber} onChange={handleChange} required className={adminInputClass} />
            </Field>
            <Field label="Current Salary">
              <input name="Currentsalary" placeholder="Current salary" value={user.Currentsalary} onChange={handleChange} className={adminInputClass} />
            </Field>
            <Field label="Ending Date">
              <input type="date" name="EOD" value={user.EOD} onChange={handleChange} className={adminInputClass} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Address">
                <textarea name="address" placeholder="Employee address" value={user.address} onChange={handleChange} rows={3} className={adminInputClass} />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Remarks">
                <textarea name="Remarks" placeholder="Notes, probation status, handover notes..." value={user.Remarks} onChange={handleChange} rows={3} className={adminInputClass} />
              </Field>
            </div>
          </div>
        </AdminPanel>

        <AdminPanel
          title="Company Resources"
          subtitle="Track laptops, SIM cards, tools, IDs, or other assets issued to this employee."
        >
          <div className="space-y-3">
            {companyResources.length === 0 && (
              <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No resources added yet.
              </div>
            )}
            {companyResources.map((resource, index) => (
              <div key={index} className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1fr_1fr_1fr_auto]">
                <input
                  placeholder="Resource name"
                  value={resource.Thingsname}
                  onChange={(e) => handleResourceChange(index, "Thingsname", e.target.value)}
                  className={adminInputClass}
                />
                <input
                  placeholder="Product / serial number"
                  value={resource.productnumber}
                  onChange={(e) => handleResourceChange(index, "productnumber", e.target.value)}
                  className={adminInputClass}
                />
                <select
                  value={resource.givenStatus}
                  onChange={(e) => handleResourceChange(index, "givenStatus", e.target.value)}
                  className={adminInputClass}
                >
                  <option value="">Status</option>
                  <option value="provided">Given</option>
                  <option value="handover">Handover</option>
                  <option value="bending">Bending</option>
                  <option value="nothandover">Not Handover</option>
                </select>
                <button
                  type="button"
                  onClick={() => setCompanyResources(companyResources.filter((_, i) => i !== index))}
                  className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                >
                  Remove
                </button>
              </div>
            ))}
            <button type="button" onClick={handleAddResource} className={adminSecondaryButtonClass}>
              Add Resource
            </button>
          </div>
        </AdminPanel>

        <AdminPanel title="Documents" subtitle="Attach employee photo and document files for admin records.">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Profile Image">
              <input type="file" name="profileimg" accept="image/*" ref={profileImgInputRef} onChange={handleFileChange} className={adminInputClass} />
            </Field>
            <Field label="File Upload">
              <input type="file" name="Fileupload" ref={fileInputRef} onChange={handleFileChange} className={adminInputClass} />
            </Field>
          </div>
        </AdminPanel>

        <div className="flex justify-end">
          <button type="submit" className={adminPrimaryButtonClass}>
            Register Employee
          </button>
        </div>
      </form>
    </AdminShell>
  );
};

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

export default CommonRegi;
