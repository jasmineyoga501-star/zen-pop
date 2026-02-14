import { ZenPopGame } from './components/ZenPopGame'
import { PayPalPayment } from './components/PayPalPayment'
import { useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Share2, X } from 'lucide-react'

function App() {
  const [showPayment, setShowPayment] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const currentUrl = window.location.href;

  return (
    <div className="zen-container">
      <ZenPopGame />

      {/* UI Controls */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 100, display: 'flex', gap: '10px' }}>
        <button
          className="premium"
          onClick={() => setShowShare(true)}
          style={{ background: 'rgba(255,255,255,0.3)', color: 'var(--text-main)', backdropFilter: 'blur(10px)' }}
        >
          <Share2 size={20} />
        </button>

        {showPayment ? (
          <div className="glass-card" style={{ padding: '20px', width: '300px' }}>
            <h3 style={{ marginBottom: '10px' }}>Zen-Pop 프리미엄 테마</h3>
            <PayPalPayment amount="0.99" onSuccess={(details) => {
              console.log("Payment Success:", details);
              setShowPayment(false);
              alert("감사합니다! 프리미엄 스킨이 해제되었습니다.");
            }} />
            <button
              onClick={() => setShowPayment(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-main)', marginTop: '10px', cursor: 'pointer', textDecoration: 'underline' }}
            >
              닫기
            </button>
          </div>
        ) : (
          <button
            className="premium"
            onClick={() => setShowPayment(true)}
          >
            ✨ 프리미엄 샵
          </button>
        )}
      </div>

      {/* Share Modal */}
      {showShare && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', position: 'relative', background: 'white' }}>
            <button onClick={() => setShowShare(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>
              <X size={24} />
            </button>
            <h2 style={{ marginBottom: '20px', color: 'var(--text-main)' }}>친구에게 공유하기</h2>
            <div style={{ background: 'white', padding: '10px', borderRadius: '10px', display: 'inline-block' }}>
              <QRCodeCanvas value={currentUrl} size={200} />
            </div>
            <p style={{ marginTop: '20px', opacity: 0.7 }}>이 QR코드를 스캔하여 게임에 접속하세요!</p>
          </div>
        </div>
      )}

      <footer style={{ position: 'fixed', bottom: '10px', left: '20px', fontSize: '0.8rem', opacity: 0.6 }}>
        Zen-Pop © 2026 | 몰입형 한글 학습 서비스
      </footer>
    </div>
  )
}

export default App
