const fs = require('fs');
const path = require('path');

const map = {
  'account_circle': 'ph-user-circle',
  'add': 'ph-plus',
  'add_location_alt': 'ph-map-pin-plus',
  'arrow_back': 'ph-arrow-left',
  'arrow_forward': 'ph-arrow-right',
  'battery_5_bar': 'ph-battery-full',
  'cake': 'ph-cake',
  'calendar_today': 'ph-calendar-blank',
  'chevron_right': 'ph-caret-right',
  'clinical_notes': 'ph-file-text',
  'close': 'ph-x',
  'cloud_upload': 'ph-cloud-arrow-up',
  'credit_card': 'ph-credit-card',
  'delete': 'ph-trash',
  'document_scanner': 'ph-scan',
  'done': 'ph-check',
  'done_all': 'ph-checks',
  'edit': 'ph-pencil-simple',
  'emergency': 'ph-first-aid',
  'event_note': 'ph-calendar-check',
  'expand_more': 'ph-caret-down',
  'favorite': 'ph-heart',
  'folder_shared': 'ph-folder-user',
  'healing': 'ph-bandaids',
  'health_and_safety': 'ph-shield-check',
  'history': 'ph-clock-counter-clockwise',
  'home': 'ph-house',
  'info': 'ph-info',
  'logout': 'ph-sign-out',
  'manage_accounts': 'ph-users-three',
  'monitoring': 'ph-chart-line-up',
  'notifications_active': 'ph-bell-ringing',
  'open_in_new': 'ph-arrow-square-out',
  'person': 'ph-user',
  'photo_camera': 'ph-camera',
  'pill': 'ph-pill',
  'pin_drop': 'ph-map-pin',
  'qr_code_2': 'ph-qr-code',
  'search': 'ph-magnifying-glass',
  'shield_lock': 'ph-shield-check',
  'shopping_bag': 'ph-shopping-bag',
  'shopping_cart': 'ph-shopping-cart',
  'signal_cellular_alt': 'ph-cell-signal-full',
  'snooze': 'ph-alarm',
  'task_alt': 'ph-check-circle',
  'warning': 'ph-warning',
  'wifi': 'ph-wifi-high'
};

const indexPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

html = html.replace(/<span class="material-symbols-outlined[^>]*>([^<]+)<\/span>/g, (match, iconName) => {
  const pIcon = map[iconName.trim()];
  if (pIcon) {
    const isFilled = match.includes('filled');
    const fillClass = isFilled ? 'ph-fill' : '';
    return `<i class="ph ${pIcon} ${fillClass}"></i>`;
  }
  return match;
});

if (!html.includes('unpkg.com/@phosphor-icons/web')) {
  html = html.replace('</head>', '  <script src="https://unpkg.com/@phosphor-icons/web"></script>\n</head>');
}

fs.writeFileSync(indexPath, html);
console.log('Icons replaced successfully!');
