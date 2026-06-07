"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; 
import axios from 'axios';
import { Mail, Lock } from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState({
    email: '',
    password: '',
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter(); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
 
   

    try {

      const response = await axios.post('http://localhost:5005/api/login', user);
      const { token, role, Eid } = response.data;

      if (token && role) {
        localStorage.setItem('admintokens', token);
        localStorage.setItem('idstore', Eid);
        localStorage.setItem('role',role);

        alert('Login successful');

       
        if (role === "md") {
          router.push('/admin/adminDasboard');
        } else if(role === "Service Engineer"|| role === "Engineer") {
          router.push('/ServiceProject/Dasboard');
        }else {
          router.push('/SaleteamDasboard/Dasboard');
        }

        setUser({
          email: '',
          password: '',
         
        });
      } else {
        setErrorMessage('Invalid response from server.');
      }
    } catch (err) {
      setErrorMessage('Login failed. Please check your credentials.');
      console.log('Login error: ', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser({
      ...user,
      [name]: value
    });
  };

  const handlePasswordReset = (e) => {
    e.preventDefault();
    router.push('/admin/restpassword');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white px-4">
      <div className="w-full max-w-md p-8 bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMessage && (
            <div className="px-4 py-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {errorMessage}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block mb-1.5 text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                id="email"
                type="email"
                name="email"
                placeholder="you@company.com"
                value={user.email}
                onChange={handleChange}
                className="w-full py-2.5 pl-10 pr-3 text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <button
                type="button"
                onClick={handlePasswordReset}
                className="text-sm font-medium text-green-700 hover:text-green-800 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                id="password"
                type="password"
                name="password"
                placeholder="Enter your password"
                value={user.password}
                onChange={handleChange}
                className="w-full py-2.5 pl-10 pr-3 text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}