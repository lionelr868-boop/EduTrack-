'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdminPaymentsView() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-0"
      dir="rtl"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-edutrack-dark flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-edutrack-primary/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-edutrack-primary" />
            </div>
            إدارة المدفوعات
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">تتبع وإدارة مدفوعات الاشتراكات</p>
        </div>
      </div>

      <Card className="border-0 shadow-md shadow-gray-100/80 bg-white">
        <CardContent className="p-6">
          <div className="text-center py-12">
            <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-muted-foreground">إدارة المدفوعات</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
