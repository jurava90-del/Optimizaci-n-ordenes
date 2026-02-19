'use client';

import { useState, useMemo, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { getOrdenesFabricacion, getHDTMueblesBySkuDescription, type OrdenFabricacion, type HDTMueble } from '@/lib/services/productionService';
import styles from './dashboard.module.css';

export default function RecentOrdersList() {
    const [orders, setOrders] = useState<OrdenFabricacion[]>([]);
    const [skuPieces, setSkuPieces] = useState<{ [key: string]: HDTMueble[] }>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initialize filters with "All" to ensure data visibility
    const [selectedYear, setSelectedYear] = useState('All');
    const [selectedMonth, setSelectedMonth] = useState('All');
    const [selectedDay, setSelectedDay] = useState('All');

    const getCleanDescription = (desc: string) => {
        const parts = desc.trim().split(' ');
        if (parts.length > 1) {
            parts.pop(); // Remove the color
        }
        return parts.join(' ').trim();
    };

    useEffect(() => {
        async function fetchAll() {
            try {
                setLoading(true);
                const ordersData = await getOrdenesFabricacion();
                setOrders(ordersData);

                // Fetch pieces for each unique cleaned product description
                const cleanDescriptions = Array.from(new Set(ordersData.map(o => getCleanDescription(o.producto_descripcion))));
                const piecesMap: { [key: string]: HDTMueble[] } = {};

                await Promise.all(cleanDescriptions.map(async (desc) => {
                    const supabase = createClient();
                    const { data: pieces } = await supabase
                        .from('HDT_MUEBLES')
                        .select('*')
                        .ilike('DESCRIPCION SKU', desc);
                    piecesMap[desc] = pieces || [];
                }));

                setSkuPieces(piecesMap);
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

    const calculateArea = (order: OrdenFabricacion) => {
        const cleanDesc = getCleanDescription(order.producto_descripcion);
        // Find match using cleaned description
        const descMatch = Object.keys(skuPieces).find(
            key => key.toLowerCase().trim() === cleanDesc.toLowerCase()
        );
        const pieces = descMatch ? skuPieces[descMatch] : [];
        if (pieces.length === 0) return 0;

        const totalAreaPerUnit = pieces.reduce((sum, piece) => {
            const largo = parseFloat(piece.LARGO || '0');
            const ancho = parseFloat(piece.ANCHO || '0');
            const cant = parseFloat(piece.CANTIDAD || '0');
            // Assume dimensions are in mm, area in m2
            return sum + (largo * ancho * cant) / 1000000;
        }, 0);

        return totalAreaPerUnit * order.cantidad;
    };

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
                            {groupedOrders[suffix].items.map((order) => {
                                const areaValue = calculateArea(order);
                                return (
                                    <div key={order.id} className={styles.activityItem}>
                                        <div className={styles.activityIcon}>🛠️</div>
                                        <div className={styles.activityDetails}>
                                            <div className={styles.orderHeaderRow}>
                                                <p>
                                                    <strong>{order.orden_fabricacion}</strong> - {getCleanDescription(order.producto_descripcion)}
                                                    {areaValue > 0 && (
                                                        <span className={styles.areaBadgeInline}>
                                                            {areaValue.toFixed(2)} m²
                                                        </span>
                                                    )}
                                                    <span className={styles.skuInline}> ({order.producto_sku})</span>
                                                </p>
                                            </div>
                                            <span>{order.planta} | Cant: {order.cantidad} | {new Date(order.created_at).toLocaleDateString()}</span>
                                            {skuPieces[getCleanDescription(order.producto_descripcion)] && skuPieces[getCleanDescription(order.producto_descripcion)].length > 0 && (
                                                <div className={styles.piecesInfo}>
                                                    <small>Relacionado con {skuPieces[getCleanDescription(order.producto_descripcion)].length} piezas en HDT_MUEBLES</small>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))
                ) : (
                    <p className={styles.noData}>No hay órdenes que coincidan con los filtros.</p>
                )}
            </div>
        </div>
    );
}
