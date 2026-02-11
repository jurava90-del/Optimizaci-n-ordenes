'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { getOrdenesFabricacion, type OrdenFabricacion } from '@/lib/services/productionService';
import styles from './dashboard.module.css';

export default function RecentOrdersList() {
    const [orders, setOrders] = useState<OrdenFabricacion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initialize filters with "All" to ensure data visibility
    const [selectedYear, setSelectedYear] = useState('All');
    const [selectedMonth, setSelectedMonth] = useState('All');
    const [selectedDay, setSelectedDay] = useState('All');

    useEffect(() => {
        async function fetchAll() {
            try {
                setLoading(true);
                const data = await getOrdenesFabricacion();
                setOrders(data);
                setError(null);
            } catch (err) {
                console.error('Error fetching dashboard orders:', err);
                setError('Error al cargar órdenes.');
            } finally {
                setLoading(false);
            }
        }
        fetchAll();
    }, []);

    const groupedOrders = useMemo(() => {
        const filtered = orders.filter(item => {
            const date = new Date(item.created_at);
            const yearMatch = selectedYear === 'All' || date.getFullYear().toString() === selectedYear;
            const monthMatch = selectedMonth === 'All' || (date.getMonth() + 1).toString().padStart(2, '0') === selectedMonth;
            const dayMatch = selectedDay === 'All' || date.getDate().toString().padStart(2, '0') === selectedDay;
            return yearMatch && monthMatch && dayMatch;
        });

        // Group by last 4 digits of SKU (Color ID)
        const groups: { [key: string]: { colorName: string, items: OrdenFabricacion[] } } = {};
        filtered.forEach(order => {
            const suffix = order.producto_sku.slice(-4);

            // Extract last word from description as color
            const words = order.producto_descripcion.trim().split(' ');
            const colorName = words[words.length - 1] || 'N/A';

            if (!groups[suffix]) {
                groups[suffix] = { colorName, items: [] };
            }
            groups[suffix].items.push(order);
        });

        return groups;
    }, [orders, selectedYear, selectedMonth, selectedDay]);

    if (loading) return <p className={styles.noData}>Cargando órdenes de fabricación...</p>;
    if (error) return <p className={styles.errorMessage}>{error}</p>;

    const groupKeys = Object.keys(groupedOrders).sort();

    return (
        <div className={styles.recentOrdersWrapper}>
            <div className={styles.dashboardFilters}>
                <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className={styles.dashSelect}
                >
                    <option value="All">Año: Todos</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                </select>

                <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className={styles.dashSelect}
                >
                    <option value="All">Mes: Todos</option>
                    {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(m => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>

                <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className={styles.dashSelect}
                >
                    <option value="All">Día: Todos</option>
                    {Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(d => (
                        <option key={d} value={d}>{d}</option>
                    ))}
                </select>

                <Link href="/prueba" className={styles.dashButton}>
                    Ir a Prueba
                </Link>
            </div>

            <div className={styles.activityList}>
                {groupKeys.length > 0 ? (
                    groupKeys.map((suffix) => (
                        <div key={suffix} className={styles.groupContainer}>
                            <h3 className={styles.groupHeader}>
                                Color: {groupedOrders[suffix].colorName} (SKU: {suffix})
                                <span className={styles.groupCount}>[{groupedOrders[suffix].items.length}]</span>
                            </h3>
                            {groupedOrders[suffix].items.map((order) => (
                                <div key={order.id} className={styles.activityItem}>
                                    <div className={styles.activityIcon}>🛠️</div>
                                    <div className={styles.activityDetails}>
                                        <p>
                                            <strong>{order.orden_fabricacion}</strong> - {order.producto_descripcion}
                                            <span className={styles.skuInline}> ({order.producto_sku})</span>
                                        </p>
                                        <span>{order.planta} | Cant: {order.cantidad} | {new Date(order.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))
                ) : (
                    <p className={styles.noData}>No hay órdenes que coincidan con los filtros.</p>
                )}
            </div>
        </div>
    );
}
