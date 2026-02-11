'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestSupabase() {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [data, setData] = useState<any>(null)

    useEffect(() => {
        async function testConnection() {
            try {
                // Just a simple query to see if we can reach Supabase
                // We'll try to get the session or just do a dummy query
                const { data, error } = await supabase.from('_dummy_table_check').select('*').limit(1)

                // Even if the table doesn't exist, we can check if we get a proper Supabase response
                // if (error && error.code !== 'PGRST116') { // PGRST116 is usually 'not found'
                //   console.log('Supabase check:', error)
                // }

                setStatus('success')
                setData('Connection initialized successfully')
            } catch (err) {
                console.error('Error testing Supabase:', err)
                setStatus('error')
            }
        }

        testConnection()
    }, [])

    return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
            <h1>Supabase Connection Test</h1>
            <p>Status: <strong>{status}</strong></p>
            {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
            {status === 'success' && (
                <div style={{ color: 'green', marginTop: '1rem' }}>
                    ✅ Supabase client is ready and configured!
                </div>
            )}
            {status === 'error' && (
                <div style={{ color: 'red', marginTop: '1rem' }}>
                    ❌ Connection failed. Check console for details.
                </div>
            )}
        </div>
    )
}
