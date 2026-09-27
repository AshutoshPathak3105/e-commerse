/**
 * Offer Validator Utility
 * Validates whether a payment offer claimed by the user matches the actual payment details (Bank or UPI Provider)
 * and safely recalculates the discount amount on the server.
 */

const BANK_ISSUER_MAP = {
  'IDIB': 'Indian Bank',
  'PUNB': 'Punjab National Bank',
  'SBIN': 'State Bank of India',
  'HDFC': 'HDFC Bank',
  'ICIC': 'ICICI Bank',
  'UTIB': 'Axis Bank',
  'KKBK': 'Kotak Mahindra Bank',
  'BARB': 'Bank of Baroda',
  'CNRB': 'Canara Bank',
  'UBIN': 'Union Bank of India',
  'INDB': 'IndusInd Bank',
  'YESB': 'Yes Bank',
  'FDRL': 'Federal Bank',
  'BKID': 'Bank of India',
  'CBIN': 'Central Bank of India',
  'IBKL': 'IDBI Bank',
  'RATN': 'RBL Bank',
  'IOBA': 'Indian Overseas Bank',
  'MAHB': 'Bank of Maharashtra',
  'PSIB': 'Punjab & Sind Bank',
  'UCBA': 'UCO Bank',
};

function getIssuerCodeFromBank(bankName) {
  if (!bankName) return '';
  const s = bankName.toLowerCase();
  if (s.includes('indian bank') && !s.includes('overseas')) return 'IDIB';
  if (s.includes('punjab') || s.includes('pnb')) return 'PUNB';
  if (s.includes('state bank') || s.includes('sbi')) return 'SBIN';
  if (s.includes('hdfc')) return 'HDFC';
  if (s.includes('icici')) return 'ICIC';
  if (s.includes('axis') || s.includes('utib')) return 'UTIB';
  if (s.includes('kotak')) return 'KKBK';
  if (s.includes('baroda') || s.includes('bob')) return 'BARB';
  if (s.includes('canara')) return 'CNRB';
  if (s.includes('union')) return 'UBIN';
  if (s.includes('indus')) return 'INDB';
  if (s.includes('yes')) return 'YESB';
  if (s.includes('federal')) return 'FDRL';
  if (s.includes('rbl') || s.includes('ratnakar')) return 'RATN';
  if (s.includes('idbi')) return 'IBKL';
  if (s.includes('overseas')) return 'IOBA';
  if (s.includes('maharashtra')) return 'MAHB';
  return '';
}

function validatePaymentOffer({ paymentMethod, paymentOffer, bank, cardType, cardIssuer, upiId, upiApp, subtotal }) {
  if (!paymentOffer) {
    return {
      hasOffer: false,
      verified: false,
      discount: 0,
      message: 'No offer applied'
    };
  }

  const partner = (paymentOffer.partner || '').trim().toLowerCase();
  const method = paymentMethod || paymentOffer.method || '';

  // If partner is empty and no discount was requested, ignore
  if (!partner && !paymentOffer.discountValue && !paymentOffer.appliedDiscount) {
    return {
      hasOffer: false,
      verified: false,
      discount: 0,
      message: 'No partner offer specified'
    };
  }

  let isMatch = false;

  if (method === 'Card') {
    const rawBank = (bank || paymentOffer.cardBank || '').trim().toLowerCase();
    const issuer = (cardIssuer || '').trim().toUpperCase();
    const verifiedBankFromIssuer = issuer && BANK_ISSUER_MAP[issuer] ? BANK_ISSUER_MAP[issuer].toLowerCase() : '';
    const actualBank = verifiedBankFromIssuer || rawBank;

    // Universal offers apply to any card
    if (partner.includes('all bank') || partner.includes('all card') || partner.includes('any card') || partner.includes('any bank')) {
      isMatch = true;
    } else {
      // Must not match if user selected other bank / standard card or bank is empty
      if (actualBank === 'other bank card' || actualBank === 'other bank' || actualBank === 'other' || (!actualBank && !issuer)) {
        isMatch = false;
      } else {
        const expectedIssuer = getIssuerCodeFromBank(partner);

        // If card issuer is cryptographically verified by Razorpay (e.g. PUNB vs IDIB)
        if (issuer && expectedIssuer) {
          isMatch = (issuer === expectedIssuer);
        } else if (issuer && !expectedIssuer) {
          // Partner didn't match a standard code, compare bank name
          const cleanP = partner.replace(/bank/g, '').replace(/[^a-z0-9]/g, '').trim();
          const cleanA = (BANK_ISSUER_MAP[issuer] || '').toLowerCase().replace(/bank/g, '').replace(/[^a-z0-9]/g, '').trim();
          isMatch = Boolean(cleanP && cleanA && (cleanP.includes(cleanA) || cleanA.includes(cleanP)));
        } else {
          // No Razorpay issuer available (e.g. sandbox/in-app simulation), match by bank name
          const isPartnerSBI = partner.includes('sbi') || partner.includes('state bank');
          const isPartnerHDFC = partner.includes('hdfc');
          const isPartnerICICI = partner.includes('icici');
          const isPartnerAXIS = partner.includes('axis');
          const isPartnerKOTAK = partner.includes('kotak');
          const isPartnerPNB = partner.includes('pnb') || partner.includes('punjab');
          const isPartnerBOB = partner.includes('baroda') || partner.includes('bob');
          const isPartnerCANARA = partner.includes('canara');
          const isPartnerUNION = partner.includes('union');
          const isPartnerINDIAN = partner.includes('indian bank') && !partner.includes('overseas');

          const isActualSBI = actualBank.includes('sbi') || actualBank.includes('state bank');
          const isActualHDFC = actualBank.includes('hdfc');
          const isActualICICI = actualBank.includes('icici');
          const isActualAXIS = actualBank.includes('axis');
          const isActualKOTAK = actualBank.includes('kotak');
          const isActualPNB = actualBank.includes('pnb') || actualBank.includes('punjab');
          const isActualBOB = actualBank.includes('baroda') || actualBank.includes('bob');
          const isActualCANARA = actualBank.includes('canara');
          const isActualUNION = actualBank.includes('union');
          const isActualINDIAN = (actualBank.includes('indian bank') && !actualBank.includes('overseas'));

          if (isPartnerSBI) isMatch = isActualSBI;
          else if (isPartnerHDFC) isMatch = isActualHDFC;
          else if (isPartnerICICI) isMatch = isActualICICI;
          else if (isPartnerAXIS) isMatch = isActualAXIS;
          else if (isPartnerKOTAK) isMatch = isActualKOTAK;
          else if (isPartnerPNB) isMatch = isActualPNB;
          else if (isPartnerBOB) isMatch = isActualBOB;
          else if (isPartnerCANARA) isMatch = isActualCANARA;
          else if (isPartnerUNION) isMatch = isActualUNION;
          else if (isPartnerINDIAN) isMatch = isActualINDIAN;
          else {
            const cleanP = partner.replace(/bank/g, '').replace(/[^a-z0-9]/g, '').trim();
            const cleanA = actualBank.replace(/bank/g, '').replace(/[^a-z0-9]/g, '').trim();
            isMatch = Boolean(cleanP && cleanA && cleanP === cleanA);
          }
        }
      }
    }
  } else if (method === 'UPI') {
    const actualApp = (upiApp || paymentOffer.upiApp || '').trim().toLowerCase();
    const actualUpiId = (upiId || paymentOffer.upiId || '').trim().toLowerCase();
    const handle = actualUpiId.includes('@') ? actualUpiId.split('@')[1] : '';

    if (partner.includes('all upi') || partner.includes('any upi')) {
      isMatch = true;
    } else {
      const bhimMatch = partner.includes('bhim') && (actualApp.includes('bhim') || handle === 'upi');
      const sbiMatch = partner.includes('sbi') && (actualApp.includes('sbi') || handle.includes('sbi'));
      const hdfcMatch = partner.includes('hdfc') && (actualApp.includes('hdfc') || handle.includes('hdfc'));
      const paytmMatch = partner.includes('paytm') && (actualApp.includes('paytm') || handle.includes('paytm'));
      const gpayMatch = (partner.includes('google') || partner.includes('gpay')) && (actualApp.includes('google') || actualApp.includes('gpay') || handle.startsWith('ok'));
      const phonepeMatch = partner.includes('phonepe') && (actualApp.includes('phonepe') || handle.includes('ybl') || handle.includes('ibl') || handle.includes('axl'));
      const amazonMatch = partner.includes('amazon') && (actualApp.includes('amazon') || handle.includes('apl'));
      const directMatch = (actualApp && (partner.includes(actualApp) || actualApp.includes(partner))) ||
                          (handle && (partner.includes(handle) || handle.includes(partner)));

      isMatch = Boolean(bhimMatch || sbiMatch || hdfcMatch || paytmMatch || gpayMatch || phonepeMatch || amazonMatch || directMatch);
    }
  }

  if (isMatch) {
    const discType = paymentOffer.discountType === 'percent' ? 'percent' : 'flat';
    const discVal = Number(paymentOffer.discountValue) || Number(paymentOffer.appliedDiscount) || 0;
    let computedDiscount = 0;

    if (discType === 'percent') {
      computedDiscount = Math.round((subtotal * discVal) / 100);
      if (paymentOffer.maxDiscount && computedDiscount > Number(paymentOffer.maxDiscount)) {
        computedDiscount = Number(paymentOffer.maxDiscount);
      }
    } else {
      computedDiscount = discVal;
    }

    if (computedDiscount > subtotal) computedDiscount = subtotal;

    return {
      hasOffer: true,
      verified: true,
      discount: computedDiscount,
      message: `Verified: ${paymentOffer.partner || 'Payment'} offer discount of ₹${computedDiscount} applied.`
    };
  } else {
    const cardOrProvider = method === 'Card'
      ? (cardIssuer && BANK_ISSUER_MAP[cardIssuer] ? `${BANK_ISSUER_MAP[cardIssuer]} (${cardIssuer})` : (bank || paymentOffer.cardBank || 'Other Card'))
      : (upiApp || upiId || paymentOffer.upiId || 'Other UPI');

    return {
      hasOffer: true,
      verified: false,
      discount: 0,
      message: `Offer validation failed: Selected offer (${paymentOffer.partner}) does not match the actual card or payment provider used (${cardOrProvider}). Full price applied.`
    };
  }
}

module.exports = {
  validatePaymentOffer,
  BANK_ISSUER_MAP,
  getIssuerCodeFromBank,
};
