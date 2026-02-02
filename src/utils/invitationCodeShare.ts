/**
 * Utility functions for portal invitation code sharing
 */

export interface ShareOptions {
  invitationCode: string;
  organizationName: string;
}

/**
 * Copy invitation code to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
};

/**
 * Generate portal login link
 */
export const generatePortalLink = (invitationCode: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/portal?invitationCode=${encodeURIComponent(invitationCode)}`;
};

/**
 * Generate WhatsApp share message
 */
export const generateWhatsAppShare = (options: ShareOptions): string => {
  const portalLink = generatePortalLink(options.invitationCode);
  const message = `🏛️ *${options.organizationName}* Auction Portal\n\nYou're invited to participate in our auctions!\n\n🔐 Invitation Code: \`${options.invitationCode}\`\n\n🔗 Link: ${portalLink}\n\nAccess the portal to start bidding now!`;
  return message;
};

/**
 * Generate WhatsApp share URL
 */
export const getWhatsAppShareUrl = (options: ShareOptions): string => {
  const message = generateWhatsAppShare(options);
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
};

/**
 * Generate Email share link
 */
export const generateEmailShare = (options: ShareOptions): { subject: string; body: string } => {
  const portalLink = generatePortalLink(options.invitationCode);
  const subject = `Invitation: Join ${options.organizationName} Auction Portal`;
  const body = `Dear Bidder,

You are invited to participate in ${options.organizationName}'s auction platform.

Invitation Code: ${options.invitationCode}

To access the portal, please visit:
${portalLink}

Or enter the invitation code manually:
${options.invitationCode}

Happy bidding!

Best regards,
${options.organizationName}`;

  return { subject, body };
};

/**
 * Generate mailto URL
 */
export const getEmailShareUrl = (options: ShareOptions, recipientEmail?: string): string => {
  const { subject, body } = generateEmailShare(options);
  const mailto = `mailto:${recipientEmail || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return mailto;
};

/**
 * Generate QR Code data URL (using qr server API)
 */
export const generateQRCode = (invitationCode: string, size: number = 300): string => {
  const portalLink = generatePortalLink(invitationCode);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(portalLink)}`;
};

/**
 * Copy link to clipboard
 */
export const copyLinkToClipboard = async (invitationCode: string): Promise<boolean> => {
  const link = generatePortalLink(invitationCode);
  return copyToClipboard(link);
};

/**
 * Share via native share API if available
 */
export const shareVia = async (options: ShareOptions): Promise<boolean> => {
  if (!navigator.share) {
    console.warn('Web Share API not supported');
    return false;
  }

  try {
    const portalLink = generatePortalLink(options.invitationCode);
    await navigator.share({
      title: `${options.organizationName} Auction Portal`,
      text: `Join ${options.organizationName}'s auction portal with code: ${options.invitationCode}`,
      url: portalLink,
    });
    return true;
  } catch (err) {
    console.error('Share failed:', err);
    return false;
  }
};
