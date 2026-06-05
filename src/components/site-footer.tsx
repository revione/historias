import Link from 'next/link'
import { getSiteStats, getTopPosts } from '@/lib/analytics/actions'
import styles from './site-footer.module.css'

export async function SiteFooter() {
  console.log('[SiteFooter] render')
  const [site, top] = await Promise.all([getSiteStats(), getTopPosts(3)])
  console.log('[SiteFooter] site=', site, 'topN=', top.length)

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.col}>
          <span className={styles.label}>visitas totales</span>
          <span className={styles.bigNum}>{site.total.toLocaleString('es')}</span>
          <span className={styles.subNum}>{site.unique.toLocaleString('es')} únicas</span>
        </div>

        <div className={styles.col}>
          <span className={styles.label}>más leídas</span>
          {top.length === 0 ? (
            <span className={styles.empty}>aún sin datos</span>
          ) : (
            <ol className={styles.topList}>
              {top.map((p) => (
                <li key={p.slug}>
                  <Link href={`/historia/${p.slug}`} className={styles.topLink}>
                    {p.slug}
                  </Link>
                  <span className={styles.topCount}>{p.views}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </footer>
  )
}
