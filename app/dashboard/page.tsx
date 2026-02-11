import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import styles from './dashboard.module.css'
import RecentOrdersList from './RecentOrdersList'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  const signOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    return redirect('/login')
  }

  return (
    <div className={styles.dashboardContainer}>
      <nav className={styles.navbar}>
        <div className={styles.logo}>MyPremiumApp</div>
        <div className={styles.navLinks}>
          <span>{user.email}</span>
          <form action={signOut}>
            <button type="submit" className={styles.btnLogout}>Sign Out</button>
          </form>
        </div>
      </nav>

      <main className={styles.mainContent}>
        <header className={styles.welcomeHeader}>
          <h1>Welcome, {user.email?.split('@')[0]}!</h1>
          <p>Here's what's happening today.</p>
        </header>

        <section className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.cardIndigo}`}>
            <h3>🚀 Active Projects</h3>
            <p className={styles.statValue}>12</p>
            <span className={styles.statLabel}>+2 this week</span>
          </div>
          <div className={`${styles.statCard} ${styles.cardCyan}`}>
            <h3>✅ Completed Tasks</h3>
            <p className={styles.statValue}>48</p>
            <span className={styles.statLabel}>92% success rate</span>
          </div>
          <div className={`${styles.statCard} ${styles.cardRose}`}>
            <h3>💎 Rewards Points</h3>
            <p className={styles.statValue}>1,250</p>
            <span className={styles.statLabel}>Silver Tier</span>
          </div>
        </section>

        <section className={styles.recentActivity}>
          <h2>Últimas Órdenes de Fabricación</h2>
          <RecentOrdersList />
        </section>
      </main>
    </div>
  )
}

