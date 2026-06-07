"use client";

import axios from 'axios';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminShell, AdminPanel, adminInputClass, adminPrimaryButtonClass } from "../_components/AdminShell";

const EmailReset = () => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  const token = localStorage.getItem('admintokens');


  const handlesubmit = async (e) => {
    e.preventDefault();

    const { name, email } = formData;
    console.log(formData)

    if (!name || !email) {
      console.log('Data is required');
      return;
    }

    try {
      const response = await axios.put('http://localhost:5005/api/reset-email', formData , {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });
      console.log(response.data);
      alert('Email has been reset');
      router.push('/');
    } catch (err) {
      console.log('An error occurred:', err.message || err);
    }
  };

  const handlechange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleBackClick = () => {
    router.push('/admin/adminDasboard')
  }

  return (
    <AdminShell title="Reset Email" subtitle="Update the email address associated with an account.">
      <AdminPanel title="Reset email" subtitle="Enter the account name and the new email address.">
        <div className="max-w-lg">
          <form onSubmit={handlesubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
              <input
                name="name"
                type="text"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handlechange}
                className={adminInputClass}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input
                name="email"
                type="email"
                placeholder="Enter your new email"
                value={formData.email}
                onChange={handlechange}
                className={adminInputClass}
                required
              />
            </div>

            <button type="submit" className={adminPrimaryButtonClass}>
              Reset Email
            </button>
          </form>
        </div>
      </AdminPanel>
    </AdminShell>
  );
};

export default EmailReset;
