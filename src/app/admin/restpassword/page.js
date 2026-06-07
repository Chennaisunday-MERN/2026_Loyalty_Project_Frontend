"use client";

import axios from 'axios';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminShell, AdminPanel, adminInputClass, adminPrimaryButtonClass } from "../_components/AdminShell";

const PasswordReset = () => {
  const router = useRouter();
  const [passwords, setPasswords] = useState({
    Eid : '',
    password: '',
    confirmPassword: '',
  });

  const handlesubmit = async (e) => {
    e.preventDefault();
    const { Eid,password, confirmPassword } = passwords;
    if (!Eid|| !password || !confirmPassword) {
      console.log('Data is required');
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    try {
      const response = await axios.put('http://localhost:5005/api/reset-password', passwords);
      console.log(response.data);
      alert('Password has been reset');
      router.push('/');
    } catch (err) {
      console.log('An error occurred', err);
    }
  };

  const handlechange = (e) => {
    const { name, value } = e.target;
    setPasswords({
      ...passwords,
      [name]: value,
    });
  };

  return (
    <AdminShell
      title="Reset Password"
      subtitle="Reset an employee's password by employee ID."
    >
      <AdminPanel title="Password reset" subtitle="Enter the employee ID and the new password.">
        <div className="max-w-lg">
          <form onSubmit={handlesubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Eid</label>
              <input
                name="Eid"
                type="Eid"
                placeholder="Enter your new password"
                value={passwords.Eid}
                onChange={handlechange}
                className={adminInputClass}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
              <input
                name="password"
                type="password"
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
                name="confirmPassword"
                type="password"
                placeholder="Confirm your new password"
                value={passwords.confirmPassword}
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
