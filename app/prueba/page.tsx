'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { getOrdenesFabricacion, type OrdenFabricacion, type HDTMueble } from '@/lib/services/productionService';
import styles from '../dashboard/dashboard.module.css';

export default function PruebaPage() {
    const [orders, setOrders] = useState<OrdenFabricacion[]>([]);
    const [skuPieces, setSkuPieces] = useState<{ [key: string]: HDTMueble[] }>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

    const getColorCode = (desc: string) => {
        // Handle descriptions like "TABLERO COMPUESTO - WSM303614-18MM"
        const parts = desc.split(' - ');
        if (parts.length > 1) {
            return parts[parts.length - 1].trim();
        }
        // Fallback to last word if no " - " separator
        const lastWordParts = desc.trim().split(' ');
        return lastWordParts.length > 0 ? lastWordParts[lastWordParts.length - 1] : '';
    };

    useEffect(() => {
        async function fetchFilteredOrders() {
            try {
                setLoading(true);
                const allOrders = await getOrdenesFabricacion();

                const filtered = allOrders.filter(order => {
                    const orderDateStr = new Date(order.created_at).toISOString().split('T')[0];
                    const isSameDay = orderDateStr === selectedDate;
                    const isCefiPlant = order.planta === 'Cefi';
                    return isSameDay && isCefiPlant;
                });

                setOrders(filtered);

                if (filtered.length > 0) {
                    const colorCodes = Array.from(new Set(filtered.map(o => getColorCode(o.producto_descripcion))));
                    const piecesMap: { [key: string]: HDTMueble[] } = {};
                    const supabase = createClient();

                    await Promise.all(colorCodes.map(async (code) => {
                        if (!code) return;

                        // Use correctly formatted column name 'DESCRIPCION_SKU'
                        const { data: pieces } = await supabase
                            .from('HDT_MUEBLES')
                            .select('*')
                            .ilike('DESCRIPCION_SKU', `%${code}%`);

                        piecesMap[code] = pieces || [];
                    }));
                    setSkuPieces(piecesMap);
                }

                setError(null);
            } catch (err) {
                console.error('Error fetching orders:', err);
                setError('Error al cargar las órdenes.');
            } finally {
                setLoading(false);
            }
        }
        fetchFilteredOrders();
    }, [selectedDate]);

    const calculateArea = (order: OrdenFabricacion) => {
        const code = getColorCode(order.producto_descripcion);
        const pieces = skuPieces[code] || [];
        if (pieces.length === 0) return 0;

        const areaPerUnit = pieces.reduce((sum, piece) => {
            const largo = parseFloat((piece as any).LARGO?.toString().replace(',', '.') || '0');
            const ancho = parseFloat((piece as any).ANCHO?.toString().replace(',', '.') || '0');
            const cant = parseFloat((piece as any).CANTIDAD?.toString().replace(',', '.') || '1');
            return sum + (largo * ancho * cant);
        }, 0);

        return (areaPerUnit * order.cantidad) / 1000000;
    };

    return (
        <div className={styles.dashboardContainer}>
            <header className={styles.navbar} style={{ marginBottom: '2rem' }}>
                <div className={styles.logo}>Órdenes de Fabricación</div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className={styles.dashSelect}
                        style={{ padding: '8px 16px' }}
                    />
                </div>
                <Link href="/dashboard" className={styles.dashButton}>
                    Volver al Dashboard
                </Link>
            </header>

            <main className={styles.mainContent}>
                <div className={styles.statsGrid}>
                    <div className={`${styles.statCard} ${styles.cardIndigo}`}>
                        <h3>Órdenes de Fabricación (Cefi)</h3>
                        <div className={styles.statValue}>{loading ? '...' : orders.length}</div>
                        <div className={styles.statLabel}>Fecha seleccionada: {new Date(selectedDate + 'T12:00:00').toLocaleDateString()}</div>
                    </div>
                </div>

                <div className={styles.activityList}>
                    {loading ? (
                        <p className={styles.noData}>Buscando órdenes...</p>
                    ) : error ? (
                        <p className={styles.errorMessage}>{error}</p>
                    ) : orders.length > 0 ? (
                        orders.map((order) => {
                            const code = getColorCode(order.producto_descripcion);
                            const pieces = skuPieces[code] || [];

                            const sumLargo = pieces.reduce((sum, piece) => sum + parseFloat(piece.LARGO || '0'), 0);
                            const sumAncho = pieces.reduce((sum, piece) => sum + parseFloat(piece.ANCHO || '0'), 0);
                            const areaValue = (sumLargo * sumAncho * order.cantidad) / 1000000;

                            return (
                                <div key={order.id} className={styles.activityItem} style={{ padding: '1rem 2rem', borderBottom: '1px solid #f1f5f9' }}>
                                    <div className={styles.activityIcon}>📅</div>
                                    <div className={styles.activityDetails}>
                                        <div className={styles.orderHeaderRow}>
                                            <p>
                                                <strong>{order.orden_fabricacion}</strong> - {order.producto_descripcion}
                                                <span className={styles.skuInline}> ({order.producto_sku})</span>
                                            </p>
                                        </div>

                                        <div className={styles.orderDataGrid}>
                                            <div className={styles.gridItem}>
                                                <label>Descripción</label>
                                                <span>{pieces.length > 0 ? (pieces[0] as any)["DESCRIPCION_SKU"] : code || '-'}</span>
                                            </div>
                                            <div className={styles.gridItem}>
                                                <label>Ancho (Total)</label>
                                                <span>{pieces.length > 0 ? (pieces.reduce((sum, p) => sum + parseFloat((p as any).ANCHO?.toString().replace(',', '.') || '0'), 0)).toFixed(2) : '-'} mm</span>
                                            </div>
                                            <div className={styles.gridItem}>
                                                <label>Largo (Total)</label>
                                                <span>{pieces.length > 0 ? (pieces.reduce((sum, p) => sum + parseFloat((p as any).LARGO?.toString().replace(',', '.') || '0'), 0)).toFixed(2) : '-'} mm</span>
                                            </div>
                                            <div className={styles.gridItem}>
                                                <label>Área</label>
                                                <span>{calculateArea(order) > 0 ? calculateArea(order).toFixed(4) : '-'} m²</span>
                                            </div>
                                        </div>

                                        <div style={{ marginTop: '0.75rem' }}>
                                            <span>{order.planta} | Cant: {order.cantidad} | {new Date(order.created_at).toLocaleTimeString()}</span>
                                        </div>

                                        {pieces.length > 0 && (
                                            <div className={styles.piecesBreakdown}>
                                                <p>Desglose de Piezas (HDT_MUEBLES):</p>
                                                <table className={styles.piecesTable}>
                                                    <thead>
                                                        <tr>
                                                            <th>Pieza</th>
                                                            <th>Largo</th>
                                                            <th>Ancho</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {pieces.map((piece, idx) => (
                                                            <tr key={idx}>
                                                                <td>{piece.PIEZA}</td>
                                                                <td>{piece.LARGO} mm</td>
                                                                <td>{piece.ANCHO} mm</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot style={{ borderTop: '2px solid #000000' }}>
                                                        <tr>
                                                            <td style={{ color: '#000000', fontWeight: '900', paddingTop: '1rem' }}>TOTAL</td>
                                                            <td style={{ color: '#000000', fontWeight: '900', paddingTop: '1rem' }}>
                                                                {pieces.reduce((sum, p) => sum + parseFloat((p as any).LARGO?.toString().replace(',', '.') || '0'), 0).toFixed(2)} mm
                                                            </td>
                                                            <td style={{ color: '#000000', fontWeight: '900', paddingTop: '1rem' }}>
                                                                {pieces.reduce((sum, p) => sum + parseFloat((p as any).ANCHO?.toString().replace(',', '.') || '0'), 0).toFixed(2)} mm
                                                            </td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className={styles.noData}>No hay órdenes registradas para la fecha seleccionada.</p>
                    )}
                </div>
            </main>
        </div>
    );
}
