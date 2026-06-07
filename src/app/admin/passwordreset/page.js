"use client";

import axios from 'axios';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminShell, AdminPanel, adminInputClass, adminPrimaryButtonClass } from "../_components/AdminShell";

const PasswordReset = () => {
  const router = useRouter();
  const [passwords, setPasswords] = useState({
    password: '',
    confirmpassword: '',
  });

  const token = localStorage.getItem('admintokens');


  const handlesubmit = async (e) => {
    e.preventDefault();
    const { password, confirmpassword } = passwords;
    if (!password || !confirmpassword) {
      console.log('data is required');
    }
    if (password !== confirmpassword) {
      alert("Passwords don't match!");
      return;
    }
    try {
      const response = await axios.put('http://localhost:5005/api/reset-headerpassword', passwords,{
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
     } ,});
      console.log(response.data);
      alert('Password is reset');
      router.push('/');
    } catch (err) {
      console.log('Error occurred', err);
    }
  };

  const handlechange = (e) => {
    const { name, value } = e.target;
    setPasswords({
      ...passwords,
      [name]: value,
    });
  };

  const handleBackClick = () => {
    router.push('/admin/adminDasboard')
  }

  return (
    <AdminShell title="Reset Password" subtitle="Update the admin password used for header access.">
      <AdminPanel title="New password" subtitle="Enter and confirm the new password.">
        <div className="max-w-lg">
          <form onSubmit={handlesubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter your new password"
                value={passwords.password}
                onChange={handlechange}
                className={adminInputClass}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Confirm Password</label>
              <input
                type="password"
                name="confirmpassword"
                placeholder="Confirm your new password"
                value={passwords.confirmpassword}
                onChange={handlechange}
                className={adminInputClass}
                required
              />
            </div>

            <button type="submit" className={adminPrimaryButtonClass}>
              Reset Password
            </button>
          </form>
        </div>
      </AdminPanel>
    </AdminShell>
  );
};

export default PasswordReset;
