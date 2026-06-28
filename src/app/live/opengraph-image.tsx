import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Transmisiune LIVE — Biserica Sfântul Ierarh Nicolae'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div style={{
        width: '1200px', height: '630px',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        position: 'relative', backgroundColor: '#0D0905'
      }}>
        {/* Fotografia aeriană ca fundal */}
        <img
          src="https://biserica-sf-nicolae.org/images/12.jpg"
          style={{
            position: 'absolute', top: 0, left: 0,
            width: '100%', height: '100%', objectFit: 'cover'
          }}
        />
        {/* Overlay întunecat pentru lizibilitate */}
        <div style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: '100%',
          backgroundColor: 'rgba(5,3,1,0.72)',
          display: 'flex'
        }} />
        {/* Badge LIVE */}
        <div style={{
          position: 'absolute', top: '38px', left: '48px',
          display: 'flex', alignItems: 'center', gap: '8px',
          backgroundColor: '#CC0000',
          padding: '6px 16px', borderRadius: '4px'
        }}>
          <div style={{
            width: '10px', height: '10px', borderRadius: '50%',
            backgroundColor: '#FF9999'
          }} />
          <span style={{
            color: '#FFFFFF', fontSize: '18px',
            fontWeight: '700', letterSpacing: '3px'
          }}>LIVE</span>
        </div>
        {/* URL site - dreapta sus */}
        <span style={{
          position: 'absolute', top: '44px', right: '48px',
          color: '#5A4020', fontSize: '14px', letterSpacing: '1px'
        }}>
          biserica-sf-nicolae.org
        </span>
        {/* Conținut central */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', textAlign: 'center',
          padding: '0 96px', position: 'relative', zIndex: 10
        }}>
          <span style={{
            color: '#6A5030', fontSize: '16px',
            letterSpacing: '4px', marginBottom: '16px'
          }}>
            ☦ PAROHIA SFÂNTUL IERARH NICOLAE
          </span>
          <span style={{
            color: '#FFFFFF', fontSize: '56px',
            fontStyle: 'italic', fontWeight: '400',
            lineHeight: '1.2', marginBottom: '16px'
          }}>
            Urmăriți slujba în direct
          </span>
          <span style={{
            color: '#C9A84C', fontSize: '28px',
            letterSpacing: '2px', marginBottom: '24px'
          }}>
            Sfânta Liturghie · Duminică · 09:00
          </span>
          <div style={{
            width: '48px', height: '1px',
            backgroundColor: '#3A2810', marginBottom: '20px'
          }} />
          <span style={{
            color: '#6A5030', fontSize: '16px', letterSpacing: '3px'
          }}>
            HÎRTOPUL MIC · RAIONUL CRIULENI · MOLDOVA
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
