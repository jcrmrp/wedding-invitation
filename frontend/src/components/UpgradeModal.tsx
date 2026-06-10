
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Keepsake tiers (same as PricingPage)
const KEEPSAKE_TIERS = [
  { id: 'keepsake-20',  images: 20,  price: '₱5,000',  amount: 500000 },
  { id: 'keepsake-50',  images: 50,  price: '₱6,000',  amount: 600000 },
  { id: 'keepsake-100', images: 100, price: '₱7,000',  amount: 700000 },
  { id: 'keepsake-200', images: 200, price: '₱10,000', amount: 1000000 },
];

// Helper: Get images count from plan string
const getGalleryLimit = (plan: string) => {
  if (plan.includes('keepsake')) {
    if (plan.includes('200')) return 200;
    if (plan.includes('100')) return 100;
    if (plan.includes('50')) return 50;
    return 20;
  }
  if (plan === 'storyteller') return 5;
  return 1;
};

// Transaction fee constants (PayMongo: 2.5% + ₱15)
const TRANSACTION_FEE_PERCENT = 0.025;
const TRANSACTION_FEE_FIXED = 1500; // in centavos (₱15)

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
  onUpgrade?: (newPlan: string, newAmount: number) => void;
}

export default function UpgradeModal({ isOpen, onClose, currentPlan, onUpgrade }: UpgradeModalProps) {
  const currentLimit = getGalleryLimit(currentPlan);
  const currentTierIndex = KEEPSAKE_TIERS.findIndex(t => t.id === currentPlan);

  const [selectedTier, setSelectedTier] = useState(
    currentTierIndex < KEEPSAKE_TIERS.length - 1 
      ? KEEPSAKE_TIERS[currentTierIndex + 1] 
      : KEEPSAKE_TIERS[0]
  );

  // Helper: Get current plan amount
  const getCurrentAmount = () => {
    if (currentPlan === 'essential') return 50000;
    if (currentPlan === 'storyteller') return 70000;
    const tier = KEEPSAKE_TIERS.find(t => t.id === currentPlan);
    return tier?.amount || 500000;
  };

  const currentAmount = getCurrentAmount();
  const priceDifference = selectedTier.amount - currentAmount;
  const transactionFee = Math.round(priceDifference * TRANSACTION_FEE_PERCENT + TRANSACTION_FEE_FIXED);
  const totalUpgradeCost = priceDifference + transactionFee;

  // Format centavos to PHP
  const formatPHP = (centavos: number) => {
    return new Intl.NumberFormat('fil-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(centavos / 100);
  };

  const handleProceed = () => {
    // In real implementation, redirect to payment or call onUpgrade
    if (onUpgrade) {
      onUpgrade(selectedTier.id, totalUpgradeCost);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'flex-start', // Changed from center to flex-start to prevent cutoff
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
        overflowY: 'auto', // Add scroll to allow scrolling the whole page
        paddingTop: '40px',
        paddingBottom: '40px'
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          style={{
            background: '#fffdf9',
            borderRadius: '24px',
            maxWidth: '500px',
            width: '100%',
            padding: '32px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            flexShrink: 0 // Prevent the modal from shrinking
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '20px'
          }}>
            <div>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                fontStyle: 'italic',
                color: '#4a3f35',
                margin: '0 0 8px'
              }}>
                📸 Upgrade Your Gallery
              </h2>
              <p style={{
                fontSize: '0.9rem',
                color: '#7b6a5d',
                margin: 0
              }}>
                You've reached your {currentLimit} photo limit. Upgrade to unlock more space!
              </p>
            </div>
            <button onClick={onClose} style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#b0a090'
            }}>
              ×
            </button>
          </div>

          {/* Current Plan Summary */}
          <div style={{
            background: '#faf4eb',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <p style={{
              fontSize: '0.85rem',
              color: '#7b6a5d',
              margin: '0 0 8px'
            }}>
              Current Plan: <strong style={{ color: '#4a3f35' }}>{currentPlan === 'storyteller' ? 'Storyteller' : currentPlan === 'essential' ? 'Essential' : `Keepsake (${currentLimit} images)`}</strong>
            </p>
            <p style={{
              fontSize: '0.85rem',
              color: '#7b6a5d',
              margin: 0
            }}>
              Gallery Limit: <strong style={{ color: '#b07f56' }}>{currentLimit} Photos</strong>
            </p>
          </div>

          {/* Upgrade Options */}
          <div style={{ marginBottom: '24px' }}>
            <p style={{
              fontSize: '0.85rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#b07f56',
              fontWeight: 700,
              margin: '0 0 12px'
            }}>
              Select New Gallery Size
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {KEEPSAKE_TIERS.filter(t => t.images > currentLimit).map(tier => {
                const isSelected = selectedTier.id === tier.id;
                return (
                  <button
                    key={tier.id}
                    onClick={() => setSelectedTier(tier)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px',
                      borderRadius: '12px',
                      border: `2px solid ${isSelected ? '#c68a4f' : '#e5d9ce'}`,
                      background: isSelected ? 'rgba(198,138,79,0.08)' : 'transparent',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                      fontFamily: 'inherit'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: `2px solid ${isSelected ? '#c68a4f' : '#d5c8be'}`,
                        background: isSelected ? '#c68a4f' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {isSelected && <div style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: '#fff'
                        }} />}
                      </div>
                      <div>
                        <div style={{
                          fontSize: '0.95rem',
                          color: '#4a3f35',
                          fontWeight: isSelected ? 700 : 400
                        }}>
                          {tier.images} Photos
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: '#c68a4f'
                      }}>
                        {tier.price}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#b0a090'
                      }}>
                        / year
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cost Breakdown */}
          <div style={{
            background: '#fff3e8',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <h4 style={{
              fontSize: '0.95rem',
              color: '#4a3f35',
              margin: '0 0 12px',
              fontWeight: 700
            }}>
              💳 Upgrade Cost Breakdown
            </h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#7b6a5d', marginBottom: '6px' }}>
              <span>Plan Difference</span>
              <span>{formatPHP(priceDifference)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#7b6a5d', marginBottom: '10px' }}>
              <span>PayMongo Transaction Fee (2.5% + ₱15)</span>
              <span>{formatPHP(transactionFee)}</span>
            </div>
            <div style={{
              height: '1px',
              background: '#e5d9ce',
              marginBottom: '10px'
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', color: '#4a3f35', fontWeight: 700 }}>
              <span>Total Due Now</span>
              <span style={{ color: '#c68a4f' }}>{formatPHP(totalUpgradeCost)}</span>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '24px',
                border: '1px solid #e5d9ce',
                background: 'transparent',
                color: '#7b6a5d',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              Later
            </button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleProceed}
              style={{
                flex: 2,
                padding: '14px',
                borderRadius: '24px',
                border: 'none',
                background: 'linear-gradient(135deg, #b07f56 0%, #c68a4f 100%)',
                color: '#fff',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 8px 28px rgba(198,138,79,0.35)'
              }}
            >
              Proceed to Upgrade
            </motion.button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
