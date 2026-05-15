'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, Shield, Building2, Users, CreditCard, TrendingUp, Activity, BarChart3 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function AdminDashboard() {
  const user = useAppStore((s) => s.user);

  const stats = [
    { label: 'المؤسسات', value: '0', icon: <Building2 className="h-5 w-5" />, color: 'bg-blue-50 text-blue-600' },
    { label: 'المستخدمون', value: '0', icon: <Users className="h-5 w-5" />, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'المدفوعات', value: '0', icon: <CreditCard className="h-5 w-5" />, color: 'bg-amber-50 text-amber-600' },
    { label: 'الإيرادات', value: '0 دج', icon: <TrendingUp className="h-5 w-5" />, color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-0"
      dir="rtl"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-edutrack-primary/10 flex items-center justify-center">
          <LayoutDashboard className="h-5 w-5 text-edutrack-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-edutrack-dark">لوحة تحكم المدير</h1>
          <p className="text-muted-foreground text-sm">نظرة شاملة على المنصة</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-edutrack-dark mt-1">{stat.value}</p>
                  </div>
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
