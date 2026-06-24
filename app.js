// app.js - Lógica e controle do aplicativo SPA Mediqia

class MediqiaApp {
  constructor() {
    this.currentUser = null;      // Dados do usuário cadastrado (localStorage)
    this.activeSession = false;   // Sessão ativa (sessionStorage - apaga ao fechar aba)
    this.addresses = [];
    this.cart = [];
    this.vault = [];
    this.schedule = [];           // Cronograma de medicações
    this.doseTaken = {};          // { 'entryId_date_time': true/false }
    this.selectedScheduleDate = null; // Data selecionada no calendário
    this.selectedScheduleColor = '#446900'; // Cor padrão
    this.activeScreen = 'screen-terms';
    this.selectedCategory = 'all';
    this.searchQuery = '';
    this.quoteResultTab = 'single'; // 'single' ou 'split'
    this.useGenerics = false;     // Toggle de genéricos
    this.selectedGenerics = {};   // Genéricos por medicamento { medId: true/false } ou por farmácia { 'pharmId_medId': true/false }
    this.selectedQuantities = {}; // Quantidades por medicamento { medId: qty }
    this.currentPrescription = null; // Detalhes da receita sendo cotada
    this._vaultPrevScreen = 'screen-home';
    this._emergencyPrevScreen = 'screen-login';
    this._historyPrevScreen = 'screen-home';
    this.navbarHideTimeout = null;
    
    // Novas variáveis de estado da Rodada 3 & 4
    this.purchaseHistory = [];    // Histórico de compras/pedidos
    this.quoteControlledSelected = false;
    this.quoteBenefitsSelected = false;
    this.quoteBenefitsData = { insurance: '', discount: '', loyalty: '', pharm: '' };
    
    this.editingScheduleId = null;
    this.selectedScheduleEntry = null;
    this.selectedScheduleTime = null;
    this.selectedScheduleDateStr = null;
    this.recentPurchaseQuantities = { dipirona: 1, omega3: 1 };
    
    // Novas variáveis da Rodada 5
    this.adherenceLog = [];
    this.searchGenericsActive = false;
    this.lastNotifiedDose = null; // Evita notificações duplicadas
    this.editingAddressId = null;
    
    // Vinculação de escopo para chamadas externas
    this.navigateTo = this.navigateTo.bind(this);
    this.loadPresetPrescription = this.loadPresetPrescription.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.repeatPurchase = this.repeatPurchase.bind(this);
    this.removeAddress = this.removeAddress.bind(this);
    this.selectScheduleColor = this.selectScheduleColor.bind(this);
    this.resetNavbarTimer = this.resetNavbarTimer.bind(this);
    this.renderPurchaseHistory = this.renderPurchaseHistory.bind(this);
    this.openScheduleActionsModal = this.openScheduleActionsModal.bind(this);
    this.openEditScheduleModal = this.openEditScheduleModal.bind(this);
    this.updateRecentPurchaseQty = this.updateRecentPurchaseQty.bind(this);
    this.openScheduleActionsModalById = this.openScheduleActionsModalById.bind(this);
    this.startDoseScheduler = this.startDoseScheduler.bind(this);
    this.playBeep = this.playBeep.bind(this);
    this.triggerDoseReminder = this.triggerDoseReminder.bind(this);
    this.openAddAddressScreen = this.openAddAddressScreen.bind(this);
    this.editAddress = this.editAddress.bind(this);
  }

  init() {
    this.loadLocalStorage();
    this.setupEventListeners();
    this.startClock();
    this.renderCategoryChips();
    this.renderShopProducts();
    this.updateCartBadge();
    
    // Inicia na Splash Screen
    this.navigateTo('screen-splash');
    const navbar = document.getElementById('app-main-navbar');
    if (navbar) navbar.style.display = 'none';

    setTimeout(() => {
      // Check session
      let session = sessionStorage.getItem('mediqia_session');
      
      // Verifica se o usuário optou por permanecer logado permanentemente
      if (!session && localStorage.getItem('mediqia_session_permanent') === 'true' && this.currentUser && this.currentUser.cpf) {
        session = JSON.stringify({ cpf: this.currentUser.cpf, loginTime: Date.now() });
        sessionStorage.setItem('mediqia_session', session); // Restaura na aba
      }

      if (session) {
        // Sessão ativa nesta aba: vai para Home
        this.activeSession = true;
        this.updateProfileUI();
        this.updateScheduleBadge();
        this.navigateTo('screen-home');
      } else {
        // Sem sessão ativa: ir para Login
        // Pré-preenche CPF se já cadastrado
        if (this.currentUser && this.currentUser.cpf) {
          const cpfField = document.getElementById('login-cpf');
          if (cpfField) cpfField.value = this.currentUser.cpf;
        }
        this.navigateTo('screen-login');
      }
      this.startDoseScheduler();
    }, 3500);
  }

  // ----------------------------------------------------
  // PERSISTÊNCIA E LOCALSTORAGE
  // ----------------------------------------------------
  loadLocalStorage() {
    const user = localStorage.getItem('mediqia_user');
    const addresses = localStorage.getItem('mediqia_addresses');
    const cart = localStorage.getItem('mediqia_cart');
    const vault = localStorage.getItem('mediqia_vault');
    const schedule = localStorage.getItem('mediqia_schedule');
    const doseTaken = localStorage.getItem('mediqia_dose_taken');

    if (user) {
      this.currentUser = JSON.parse(user);
      if (this.currentUser) {
        if (!this.currentUser.bloodType) this.currentUser.bloodType = "O+";
        if (!this.currentUser.insuranceName) this.currentUser.insuranceName = "SulAmérica Saúde";
        if (!this.currentUser.insuranceNumber) this.currentUser.insuranceNumber = "987654321012345";
        if (!this.currentUser.insuranceCode) this.currentUser.insuranceCode = "321";
        if (!this.currentUser.conditions) this.currentUser.conditions = ["Diabetes", "Hipertensão"];
        if (!this.currentUser.allergies) this.currentUser.allergies = ["Penicilina", "Dipirona"];
        if (!this.currentUser.medicalNotes) this.currentUser.medicalNotes = "Uso contínuo de Losartana para hipertensão.";
      }
    } else {
      this.currentUser = {
        name: "Alexandre Silva",
        cpf: "123.456.789-00",
        birthdate: "1988-06-15",
        sex: "M",
        bloodType: "O+",
        insuranceName: "SulAmérica Saúde",
        insuranceNumber: "987654321012345",
        insuranceCode: "321",
        conditions: ["Diabetes", "Hipertensão"],
        otherConditions: "Asma leve",
        allergies: ["Penicilina", "Dipirona"],
        medicalNotes: "Uso contínuo de Losartana para hipertensão."
      };
      this.saveUser();
    }
    
    if (addresses) {
      this.addresses = JSON.parse(addresses);
    } else {
      this.addresses = [
        {
          id: 'addr_default',
          cep: '01310-100',
          street: 'Avenida Paulista',
          number: '1000',
          complement: 'Apto 51',
          neighborhood: 'Bela Vista',
          city: 'São Paulo',
          state: 'SP'
        }
      ];
      this.saveAddresses();
    }

    if (cart) this.cart = JSON.parse(cart);
    
    if (vault) {
      this.vault = JSON.parse(vault);
    } else {
      this.vault = [
        {
          id: 'v1',
          title: "Receita Tripla (Cesta Única Vence)",
          date: "10/05/2026",
          doctorName: "Dr. João Silva",
          doctorSpecialty: "Cardiologista",
          medicines: ["Dipirona Monoidratada 500mg", "Losartana Potássica 50mg", "Omeprazol 20mg (30 cápsulas)"],
          presetKey: 'preset1'
        },
        {
          id: 'v2',
          title: "Receita de Antibiótico (Cesta Dividida Vence)",
          date: "22/04/2026",
          doctorName: "Dra. Ana Souza",
          doctorSpecialty: "Pediatra",
          medicines: ["Amoxicilina 500mg (30 cápsulas)", "Ibuprofeno 600mg (20 comp.)", "Simeticona 75mg/mL Gotas (15mL)"],
          presetKey: 'preset2'
        }
      ];
      this.saveVault();
    }
    
    if (schedule) {
      this.schedule = JSON.parse(schedule);
    } else {
      // Cronograma de exemplo inicial
      this.schedule = [
        {
          id: 'sched_1',
          medicineName: 'Losartana 50mg',
          dosage: '1 comprimido',
          times: ['08:00', '20:00'],
          frequency: 'daily',
          customDays: [],
          color: '#446900',
          startDate: new Date().toISOString().split('T')[0]
        },
        {
          id: 'sched_2',
          medicineName: 'Dipirona 500mg',
          dosage: '1 comprimido (se necessário)',
          times: ['14:00'],
          frequency: 'daily',
          customDays: [],
          color: '#d63649',
          startDate: new Date().toISOString().split('T')[0]
        }
      ];
      this.saveSchedule();
    }
    
    if (doseTaken) this.doseTaken = JSON.parse(doseTaken);
    
    // Carrega Histórico de Compras
    const purchaseHistory = localStorage.getItem('mediqia_purchase_history');
    if (purchaseHistory) {
      this.purchaseHistory = JSON.parse(purchaseHistory);
    } else {
      // Mock de compras distribuídas nos últimos 6 meses para teste de filtros
      this.purchaseHistory = [
        {
          id: 'ord_1',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 dias atrás
          pharmacy: 'Drogasil',
          medicines: [
            { id: 'losartana', name: 'Losartana Potássica 50mg (30 comp.)', quantity: 2, price: 9.90, brand: 'Neo Química' }
          ],
          subtotal: 19.80,
          deliveryFee: 5.90,
          discount: 2.97, // 15% de desconto progressivo por convênio
          total: 22.73,
          savings: 5.40,
          paymentMethod: 'Pix',
          status: 'Entregue'
        },
        {
          id: 'ord_2',
          date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 28 dias atrás
          pharmacy: 'Pague Menos',
          medicines: [
            { id: 'dipirona', name: 'Dipirona Monoidratada 500mg', quantity: 1, price: 4.20, brand: 'Medley Genéricos' }
          ],
          subtotal: 4.20,
          deliveryFee: 3.50,
          discount: 0,
          total: 7.70,
          savings: 1.20,
          paymentMethod: 'Cartão de Crédito',
          status: 'Entregue'
        },
        {
          id: 'ord_3',
          date: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 75 dias atrás
          pharmacy: 'Farmácia Verde',
          medicines: [
            { id: 'omeprazol', name: 'Omeprazol 20mg (30 cápsulas)', quantity: 2, price: 8.00, brand: 'Medley' }
          ],
          subtotal: 16.00,
          deliveryFee: 4.90,
          discount: 3.20, // 20% de desconto progressivo por convênio
          total: 17.70,
          savings: 4.50,
          paymentMethod: 'Cartão de Débito',
          status: 'Entregue'
        },
        {
          id: 'ord_4',
          date: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 150 dias atrás
          pharmacy: 'Drogaria São Paulo',
          medicines: [
            { id: 'ibuprofeno', name: 'Ibuprofeno 600mg (20 comp.)', quantity: 1, price: 15.00, brand: 'Alivium' }
          ],
          subtotal: 15.00,
          deliveryFee: 6.00,
          discount: 0,
          total: 21.00,
          savings: 3.00,
          paymentMethod: 'Cartão de Crédito',
          status: 'Entregue'
        }
      ];
      this.savePurchaseHistory();
    }
    
    // Carrega Histórico de Adesão
    const adherenceLog = localStorage.getItem('mediqia_adherence_log');
    if (adherenceLog) {
      this.adherenceLog = JSON.parse(adherenceLog);
    } else {
      this.adherenceLog = [
        {
          date: new Date().toISOString().split('T')[0],
          scheduledTime: '08:00',
          confirmTime: '08:03',
          medicineName: 'Losartana 50mg',
          dosage: '1 comprimido'
        }
      ];
      localStorage.setItem('mediqia_adherence_log', JSON.stringify(this.adherenceLog));
    }
    
    // Data selecionada padrão = hoje
    this.selectedScheduleDate = new Date().toISOString().split('T')[0];
  }

  saveUser() {
    localStorage.setItem('mediqia_user', JSON.stringify(this.currentUser));
  }

  saveAddresses() {
    localStorage.setItem('mediqia_addresses', JSON.stringify(this.addresses));
  }

  saveCart() {
    localStorage.setItem('mediqia_cart', JSON.stringify(this.cart));
  }

  saveVault() {
    localStorage.setItem('mediqia_vault', JSON.stringify(this.vault));
  }
  
  saveSchedule() {
    localStorage.setItem('mediqia_schedule', JSON.stringify(this.schedule));
  }
  
  saveDoseTaken() {
    localStorage.setItem('mediqia_dose_taken', JSON.stringify(this.doseTaken));
  }

  savePurchaseHistory() {
    localStorage.setItem('mediqia_purchase_history', JSON.stringify(this.purchaseHistory));
  }

  // Relógio do celular simulado
  startClock() {
    const timeEl = document.getElementById('statusbar-time');
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      timeEl.textContent = `${hrs}:${mins}`;
    };
    updateTime();
    setInterval(updateTime, 60000);
  }

  // ----------------------------------------------------
  // CONFIGURAÇÃO DOS EVENTOS DO DOM
  // ----------------------------------------------------
  setupEventListeners() {
    // Top Bar Actions
    document.getElementById('header-logo-btn').addEventListener('click', () => {
      if (this.currentUser && this.currentUser.cpf) this.navigateTo('screen-home');
    });
    document.getElementById('header-cart-btn').addEventListener('click', () => {
      if (this.currentUser && this.currentUser.cpf) this.navigateTo('screen-cart');
    });
    document.getElementById('header-profile-btn').addEventListener('click', () => {
      if (this.currentUser && this.currentUser.cpf) this.navigateTo('screen-profile');
    });

    // LGPD Terms Screen – salva aceite permanente
    document.getElementById('btn-accept-terms').addEventListener('click', () => {
      localStorage.setItem('mediqia_terms_accepted', 'true');
      this.navigateTo('screen-home');
    });

    // Login Screen – salva sessão em sessionStorage (apaga ao fechar)
    document.getElementById('btn-login-submit').addEventListener('click', () => {
      const cpfInput = document.getElementById('login-cpf').value.trim();
      
      if (!cpfInput || cpfInput.length < 5) {
        alert('Por favor, insira seu CPF, e-mail ou telefone para prosseguir.');
        return;
      }

      // Cria ou atualiza usuário no localStorage (dados permanentes)
      if (!this.currentUser) this.currentUser = {};
      this.currentUser.cpf = cpfInput; // Storing as cpf for compatibility
      this.currentUser.name = this.currentUser.name || "Visitante"; // Default fallback
      this.saveUser();
      
      // Registra sessão ativa em sessionStorage (dura apenas enquanto aba aberta)
      sessionStorage.setItem('mediqia_session', JSON.stringify({ cpf: cpfInput, loginTime: Date.now() }));
      
      // Default to keep logged in for now, since checkbox is removed
      localStorage.setItem('mediqia_session_permanent', 'true');
      
      this.activeSession = true;
      this.updateProfileUI();
      this.updateScheduleBadge();
      
      const termsAccepted = localStorage.getItem('mediqia_terms_accepted');
      if (!termsAccepted) {
        this.navigateTo('screen-terms');
      } else {
        this.navigateTo('screen-home');
      }
    });

    // Formatação de CPF automática no Login (removida pois agora aceita e-mail/telefone)
    const loginCpfInput = document.getElementById('login-cpf');
    if (loginCpfInput) {
      loginCpfInput.addEventListener('input', (e) => {
        // Se for só números, pode formatar, mas não é obrigatório para e-mail
        const isNumeric = /^\d+$/.test(e.target.value.replace(/\D/g, ''));
        if (isNumeric && e.target.value.includes('@') === false && e.target.value.replace(/\D/g, '').length === 11) {
            let v = e.target.value.replace(/\D/g, "");
            e.target.value = `${v.substring(0,3)}.${v.substring(3,6)}.${v.substring(6,9)}-${v.substring(9)}`;
        }
      });
    }

    // Home screen buttons
    document.getElementById('btn-scan-prescription-trigger').addEventListener('click', () => {
      this.navigateTo('screen-scanner');
    });
    document.getElementById('home-history-btn').addEventListener('click', () => {
      this.navigateTo('screen-purchase-history');
    });

    // Filtros de histórico de compras
    document.getElementById('btn-back-history').addEventListener('click', () => {
      this.navigateTo(this._historyPrevScreen || 'screen-home');
    });
    document.getElementById('history-filter-period').addEventListener('change', (e) => {
      const customDates = document.getElementById('history-custom-dates');
      customDates.style.display = e.target.value === 'custom' ? 'flex' : 'none';
      this.renderPurchaseHistory();
    });
    document.getElementById('history-filter-start').addEventListener('change', () => this.renderPurchaseHistory());
    document.getElementById('history-filter-end').addEventListener('change', () => this.renderPurchaseHistory());
    document.getElementById('history-filter-medicine').addEventListener('input', () => this.renderPurchaseHistory());

    // Scanner camera simulated shutter
    document.getElementById('btn-camera-shutter').addEventListener('click', () => {
      this.runOCRSimulation('preset1'); // Usa preset 1 como padrão se clicar na foto vazia
    });

    // File Upload simulated input
    const fileBtn = document.getElementById('btn-recipe-upload-file');
    const fileInput = document.getElementById('recipe-file-input');
    fileBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        // Mostra a foto no enquadramento
        const reader = new FileReader();
        reader.onload = (event) => {
          document.getElementById('camera-mock-preview').src = event.target.result;
        };
        reader.readAsDataURL(e.target.files[0]);
        // Dispara o escaneamento simulado
        this.runOCRSimulation('preset3'); // Preset completo para o upload de arquivo
      }
    });

    // Modal de Genéricos e Configurações (Wizard de Pré-Cotação)
    const controlledYes = document.getElementById('btn-quote-controlled-yes');
    const controlledNo = document.getElementById('btn-quote-controlled-no');
    const benefitsYes = document.getElementById('btn-quote-benefits-yes');
    const benefitsNo = document.getElementById('btn-quote-benefits-no');
    const benefitsFields = document.getElementById('quote-benefits-fields');

    let isControlledActive = false;
    let isBenefitsActive = false;

    if (controlledYes && controlledNo) {
      controlledYes.addEventListener('click', () => {
        controlledYes.classList.remove('secondary');
        controlledYes.classList.add('primary');
        controlledNo.classList.remove('primary');
        controlledNo.classList.add('secondary');
        isControlledActive = true;
      });
      controlledNo.addEventListener('click', () => {
        controlledNo.classList.remove('secondary');
        controlledNo.classList.add('primary');
        controlledYes.classList.remove('primary');
        controlledYes.classList.add('secondary');
        isControlledActive = false;
      });
    }

    if (benefitsYes && benefitsNo) {
      benefitsYes.addEventListener('click', () => {
        benefitsYes.classList.remove('secondary');
        benefitsYes.classList.add('primary');
        benefitsNo.classList.remove('primary');
        benefitsNo.classList.add('secondary');
        if (benefitsFields) benefitsFields.style.display = 'flex';
        isBenefitsActive = true;
      });
      benefitsNo.addEventListener('click', () => {
        benefitsNo.classList.remove('secondary');
        benefitsNo.classList.add('primary');
        benefitsYes.classList.remove('primary');
        benefitsYes.classList.add('secondary');
        if (benefitsFields) benefitsFields.style.display = 'none';
        isBenefitsActive = false;
      });
    }

    const saveQuoteConfigBtn = document.getElementById('btn-save-quote-config');
    if (saveQuoteConfigBtn) {
      saveQuoteConfigBtn.addEventListener('click', () => {
        this.currentPrescription = this._pendingOCR;
        this.selectedGenerics = {};
        this.selectedQuantities = {};
        
        // Armazena informações de benefícios se ativo
        this.benefits = {
          active: isBenefitsActive,
          insurance: isBenefitsActive ? document.getElementById('quote-benefit-insurance').value.trim() : '',
          program: isBenefitsActive ? document.getElementById('quote-benefit-program').value.trim() : '',
          fidelity: isBenefitsActive ? document.getElementById('quote-benefit-fidelity').value.trim() : '',
          pharma: isBenefitsActive ? document.getElementById('quote-benefit-pharma').value.trim() : ''
        };
        // Armazena quais medicamentos foram autorizados para genérico
        this.allowedGenerics = [];
        const genericCheckboxes = document.querySelectorAll('.generic-filter-checkbox');
        genericCheckboxes.forEach(cb => {
          if (cb.checked) {
            this.allowedGenerics.push(cb.value);
          }
        });

        // Inicializa escolhas e quantidades apenas se for a primeira vez
        if (!this.selectedQuantities || Object.keys(this.selectedQuantities).length === 0) {
          this.currentPrescription.medicines.forEach(medId => {
            this.selectedGenerics[medId] = false; // Começa sempre com Referência (original)
            this.selectedQuantities[medId] = 1;
          });
        }
        
        // Limpa a ordem fixa de renderização para a nova cotação
        this.pharmacyFixedOrder = null;

        this.closeModal('modal-ask-generics');

        const hasControlledInRecipe = this.currentPrescription.medicines.some(medId => {
          const item = MEDICINES_CATALOG.find(c => c.id === medId);
          return item && item.requiresPrescription;
        });

        if (isControlledActive || hasControlledInRecipe) {
          this.controlledAlertContext = 'quote';
          this.openModal('modal-controlled-alert');
        } else {
          this.renderQuotationResults();
          this.navigateTo('screen-quote-results');
        }
      });
    }

    // Results Tab Switchers
    document.getElementById('tab-single-basket').addEventListener('click', (e) => {
      document.getElementById('tab-split-basket').classList.remove('active');
      e.target.classList.add('active');
      this.quoteResultTab = 'single';
      this.renderQuotationResults();
    });
    document.getElementById('tab-split-basket').addEventListener('click', (e) => {
      document.getElementById('tab-single-basket').classList.remove('active');
      e.target.classList.add('active');
      this.quoteResultTab = 'split';
      this.renderQuotationResults();
    });

    // Shop search
    const shopSearchInput = document.getElementById('shop-search-input');
    if (shopSearchInput) {
      shopSearchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.renderShopProducts();
      });
    }

    const shopOrderFilter = document.getElementById('shop-filter-order');
    if (shopOrderFilter) {
      shopOrderFilter.addEventListener('change', () => {
        this.renderShopProducts();
      });
    }

    const shopNetworkFilter = document.getElementById('shop-filter-network');
    if (shopNetworkFilter) {
      shopNetworkFilter.addEventListener('change', () => {
        this.renderShopProducts();
      });
    }

    // Cart Checkout Proceed
    document.getElementById('btn-cart-checkout-proceed').addEventListener('click', () => {
      if (this.cart.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
      }
      this.navigateTo('screen-checkout');
    });

    // Checkout final validation
    document.getElementById('btn-checkout-finish').addEventListener('click', () => {
      // Verifica se possui algum item controlado
      const hasControlled = this.cart.some(item => {
        // Encontra o item correspondente no catálogo
        const catItem = MEDICINES_CATALOG.find(c => c.id === item.id);
        return catItem && catItem.requiresPrescription;
      });

      if (hasControlled) {
        this.controlledAlertContext = 'checkout';
        this.openModal('modal-controlled-alert');
      } else {
        this.completeOrder();
      }
    });

    // Controlled Prescription Confirmation Modal Action
    document.getElementById('btn-confirm-controlled-checkout').addEventListener('click', () => {
      this.closeModal('modal-controlled-alert');
      if (this.controlledAlertContext === 'quote') {
        this.renderQuotationResults();
        this.navigateTo('screen-quote-results');
      } else {
        this.completeOrder();
      }
    });

    // Order Success Modal Close
    document.getElementById('btn-success-modal-close').addEventListener('click', () => {
      this.closeModal('modal-order-success');
      this.navigateTo('screen-home');
    });

    // Edit Profile Save
    document.getElementById('btn-save-profile').addEventListener('click', () => {
      const success = this.saveProfileFormData();
      if (!success) {
        alert("O nome não pode ficar em branco.");
        return;
      }
      this.updateProfileUI();
      alert("Dados salvos com sucesso!");
      this.navigateTo('screen-profile');
    });

    // Logout – limpa sessão e dados locais
    document.querySelectorAll('.btn-logout').forEach(btn => {
      btn.addEventListener('click', () => {
        sessionStorage.clear();
        localStorage.removeItem('mediqia_session_permanent');
        this.activeSession = false;
        this.currentUser = null;
        if (document.getElementById('login-cpf')) document.getElementById('login-cpf').value = '';
        document.getElementById('app-main-navbar').style.display = 'none';
        this.navigateTo('screen-login');
      });
    });

    // Add New Address Form
    document.getElementById('btn-save-address').addEventListener('click', () => {
      const cep = document.getElementById('addr-cep').value.trim();
      const street = document.getElementById('addr-street').value.trim();
      const number = document.getElementById('addr-number').value.trim();
      const complement = document.getElementById('addr-complement').value.trim();
      const neighborhood = document.getElementById('addr-neighborhood').value.trim();

      if (!cep || !street || !number || !neighborhood) {
        alert("Por favor, preencha todos os campos obrigatórios.");
        return;
      }

      if (this.editingAddressId) {
        const addr = this.addresses.find(a => a.id === this.editingAddressId);
        if (addr) {
          addr.cep = cep;
          addr.street = street;
          addr.number = number;
          addr.complement = complement;
          addr.neighborhood = neighborhood;
          this.saveAddresses();
          alert("Endereço atualizado com sucesso!");
        }
        this.editingAddressId = null;
      } else {
        const newAddr = {
          id: 'addr_' + Date.now(),
          cep,
          street,
          number,
          complement,
          neighborhood,
          city: 'São Paulo',
          state: 'SP'
        };

        this.addresses.push(newAddr);
        this.saveAddresses();
        alert("Endereço adicionado com sucesso!");
      }
      
      // Limpa formulário
      document.getElementById('addr-cep').value = '';
      document.getElementById('addr-street').value = '';
      document.getElementById('addr-number').value = '';
      document.getElementById('addr-complement').value = '';
      document.getElementById('addr-neighborhood').value = '';

      // Retorna para a tela anterior
      const prev = document.getElementById('btn-back-new-address').getAttribute('data-prev') || 'screen-profile';
      this.navigateTo(prev);
    });

    // Registrar clique na barra de navegação flutuante inferior
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const target = e.currentTarget.getAttribute('data-target');
        this.navigateTo(target);
      });
    });

    // Botão central de SCAN no dock flutuante
    const navScanBtn = document.getElementById('btn-nav-scan');
    if (navScanBtn) {
      navScanBtn.addEventListener('click', () => {
        this.navigateTo('screen-scanner');
      });
    }

    // Vault back button - smart navigation
    document.getElementById('btn-back-vault').addEventListener('click', () => {
      const prevScreen = this._vaultPrevScreen || 'screen-home';
      this.navigateTo(prevScreen);
    });

    // Formatação de CEP
    document.getElementById('addr-cep').addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, "");
      if (v.length > 8) v = v.substring(0, 8);
      if (v.length > 5) {
        e.target.value = `${v.substring(0,5)}-${v.substring(5)}`;
      } else {
        e.target.value = v;
      }
    });

    // ---- CRONOGRAMA ----
    // Abrir modal
    document.getElementById('btn-open-schedule-modal').addEventListener('click', () => {
      this.editingScheduleId = null;
      document.getElementById('sched-med-name').value = '';
      document.getElementById('sched-dosage').value = '';
      document.getElementById('sched-frequency').value = 'daily';
      document.getElementById('sched-days-selector').style.display = 'none';
      document.getElementById('sched-times-container').innerHTML = 
        `<div style="display:flex;gap:8px;"><input class="form-input sched-time-input" type="time" value="08:00" style="flex:1;">
         <button class="remove-item-btn" onclick="this.parentElement.remove()" style="flex-shrink:0;"><span class="material-symbols-outlined">close</span></button></div>`;
      
      this.selectedScheduleColor = '#446900';
      document.querySelectorAll('.color-swatch').forEach(sw => sw.classList.remove('active'));
      const defaultSwatch = document.querySelector('.color-swatch[data-color="#446900"]');
      if (defaultSwatch) defaultSwatch.classList.add('active');

      this.openModal('modal-add-schedule');
    });
    
    // Adicionar horário no modal
    document.getElementById('btn-add-sched-time').addEventListener('click', () => {
      const container = document.getElementById('sched-times-container');
      if (container.children.length >= 4) {
        alert('Máximo de 4 horários por medicamento.');
        return;
      }
      const row = document.createElement('div');
      row.style.cssText = 'display: flex; gap: 8px;';
      row.innerHTML = `<input class="form-input sched-time-input" type="time" value="12:00" style="flex: 1;">
        <button class="remove-item-btn" onclick="this.parentElement.remove()" style="flex-shrink:0;">
          <span class="material-symbols-outlined">close</span>
        </button>`;
      container.appendChild(row);
    });
    
    // Frequência customizada
    document.getElementById('sched-frequency').addEventListener('change', (e) => {
      const daysSelector = document.getElementById('sched-days-selector');
      daysSelector.style.display = e.target.value === 'custom' ? 'block' : 'none';
    });
    
    // Salvar entrada no cronograma
    document.getElementById('btn-save-schedule-entry').addEventListener('click', () => {
      const name = document.getElementById('sched-med-name').value.trim();
      const dosage = document.getElementById('sched-dosage').value.trim();
      const frequency = document.getElementById('sched-frequency').value;
      
      if (!name) { alert('Informe o nome do medicamento.'); return; }
      
      const timeInputs = document.querySelectorAll('.sched-time-input');
      const times = [...timeInputs].map(i => i.value).filter(Boolean);
      
      const customDays = [];
      if (frequency === 'custom') {
        document.querySelectorAll('#sched-days-selector input:checked').forEach(cb => {
          customDays.push(Number(cb.value));
        });
      }
      
      if (this.editingScheduleId) {
        const index = this.schedule.findIndex(s => s.id === this.editingScheduleId);
        if (index !== -1) {
          this.schedule[index].medicineName = name;
          this.schedule[index].dosage = dosage || '1 dose';
          this.schedule[index].times = times;
          this.schedule[index].frequency = frequency;
          this.schedule[index].customDays = customDays;
          this.schedule[index].color = this.selectedScheduleColor;
        }
        this.editingScheduleId = null;
      } else {
        const entry = {
          id: 'sched_' + Date.now(),
          medicineName: name,
          dosage: dosage || '1 dose',
          times,
          frequency,
          customDays,
          color: this.selectedScheduleColor,
          startDate: new Date().toISOString().split('T')[0]
        };
        this.schedule.push(entry);
      }
      
      this.saveSchedule();
      this.closeModal('modal-add-schedule');
      
      // Reset form
      document.getElementById('sched-med-name').value = '';
      document.getElementById('sched-dosage').value = '';
      document.getElementById('sched-times-container').innerHTML = 
        `<div style="display:flex;gap:8px;"><input class="form-input sched-time-input" type="time" value="08:00" style="flex:1;">
         <button class="remove-item-btn" onclick="this.parentElement.remove()" style="flex-shrink:0;"><span class="material-symbols-outlined">close</span></button></div>`;
      
      this.renderSchedule();
      this.updateScheduleBadge();
      this.updateHomeRoutineCard();
      
      // Solicitar permissão de notificações
      this.requestNotificationPermission();
    });

    // Modal de ações do cronograma (simplificado)
    const editActionBtn = document.getElementById('btn-schedule-action-edit');
    if (editActionBtn) {
      editActionBtn.addEventListener('click', () => {
        if (this.selectedScheduleEntry) {
          this.closeModal('modal-schedule-actions');
          this.openEditScheduleModal(this.selectedScheduleEntry);
        }
      });
    }

    const deleteActionBtn = document.getElementById('btn-schedule-action-delete');
    if (deleteActionBtn) {
      deleteActionBtn.addEventListener('click', () => {
        if (this.selectedScheduleEntry) {
          this.closeModal('modal-schedule-actions');
          this.removeScheduleEntry(this.selectedScheduleEntry.id);
        }
      });
    }

    // Botão de simular notificação
    const simulateNotificationBtn = document.getElementById('btn-simulate-notification');
    if (simulateNotificationBtn) {
      simulateNotificationBtn.addEventListener('click', () => {
        const entry = this.schedule[0] || {
          id: 'sched_demo',
          medicineName: 'Dipirona 500mg',
          dosage: '1 comprimido',
          times: ['08:00'],
          color: '#446900'
        };
        const time = entry.times[0] || '08:00';
        const dateStr = new Date().toISOString().split('T')[0];
        
        alert('Simulando lembrete de medicamento em 3 segundos...');
        setTimeout(() => {
          this.triggerDoseReminder(entry, time, dateStr);
        }, 3000);
      });
    }

    // Botões do lembrete de dose (modal)
    const reminderTakeBtn = document.getElementById('btn-reminder-take');
    if (reminderTakeBtn) {
      reminderTakeBtn.addEventListener('click', () => {
        if (this.reminderActiveDose) {
          const { entry, time, dateStr } = this.reminderActiveDose;
          this.markDoseTaken(entry.id, dateStr, time, true);
          this.closeModal('modal-dose-reminder');
          this.reminderActiveDose = null;
        }
      });
    }

    const reminderSnoozeBtn = document.getElementById('btn-reminder-snooze');
    if (reminderSnoozeBtn) {
      reminderSnoozeBtn.addEventListener('click', () => {
        this.closeModal('modal-dose-reminder');
        if (this.reminderActiveDose) {
          const { entry, time } = this.reminderActiveDose;
          alert(`Lembrete para ${entry.medicineName} adiado por 10 minutos.`);
          setTimeout(() => {
            this.triggerDoseReminder(entry, time, new Date().toISOString().split('T')[0]);
          }, 10000); // 10s para fins de teste rápido
          this.reminderActiveDose = null;
        }
      });
    }
    
    // Toggle histórico
    document.getElementById('btn-toggle-history').addEventListener('click', () => {
      const container = document.getElementById('schedule-history-container');
      const chevron = document.getElementById('history-chevron');
      const isHidden = container.style.display === 'none';
      container.style.display = isHidden ? 'block' : 'none';
      if (chevron) {
        chevron.className = isHidden ? 'ph ph-caret-up' : 'ph ph-caret-down';
      }
      if (isHidden) this.renderScheduleHistory();
    });

    // ---- PERFIL AMPLIADO ----
    // Calcular idade ao mudar data de nascimento
    document.getElementById('edit-birthdate').addEventListener('change', (e) => {
      this.updateAgeDisplay(e.target.value);
    });
    
    // Adicionar alergia
    document.getElementById('btn-add-allergy').addEventListener('click', () => {
      const input = document.getElementById('allergy-input');
      const value = input.value.trim();
      if (!value) return;
      if (!this.currentUser.allergies) this.currentUser.allergies = [];
      if (!this.currentUser.allergies.includes(value)) {
        this.currentUser.allergies.push(value);
        this.saveUser();
        this.renderAllergyChips();
      }
      input.value = '';
    });
    
    // Enter no campo de alergia
    document.getElementById('allergy-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('btn-add-allergy').click();
    });

    // Emergência
    document.getElementById('btn-login-emergency').addEventListener('click', () => {
      this.navigateTo('screen-emergency');
    });
    document.getElementById('btn-home-emergency').addEventListener('click', () => {
      this.navigateTo('screen-emergency');
    });
    document.getElementById('btn-back-emergency').addEventListener('click', () => {
      const prev = this._emergencyPrevScreen || 'screen-login';
      this.navigateTo(prev);
    });

    // Auto-hiding navbar interaction events
    const resetEvents = ['click', 'touchstart', 'keypress'];
    resetEvents.forEach(evt => {
      document.addEventListener(evt, () => {
        this.resetNavbarTimer();
      }, { passive: true });
    });

    const scrollContainer = document.getElementById('screen-container');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', () => {
        this.resetNavbarTimer();
      }, { passive: true });
    }
  }

  // ----------------------------------------------------
  // MOTOR DE NAVEGAÇÃO E VISUAL
  // ----------------------------------------------------


  navigateTo(screenId) {
    // Autenticação obrigatória para telas protegidas (Logout/Segurança)
    const publicScreens = ['screen-splash', 'screen-terms', 'screen-login', 'screen-emergency'];
    if (!this.activeSession && !publicScreens.includes(screenId)) {
      this.activeSession = false;
      this.currentUser = null;
      document.getElementById('app-main-navbar').style.display = 'none';
      screenId = 'screen-login';
    }

    // Capture previous screen BEFORE updating state
    const prevScreenId = this.activeScreen;

    // Oculta todas as telas
    document.querySelectorAll('.screen').forEach(scr => {
      scr.classList.remove('active');
    });

    // Controla a exibição do Header Global
    const header = document.querySelector('header.app-header');
    if (header) {
      const noHeaderScreens = ['screen-splash', 'screen-login', 'screen-terms'];
      if (noHeaderScreens.includes(screenId)) {
        header.style.display = 'none';
      } else {
        header.style.display = 'flex';
      }
    }

    // Ativa a selecionada
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
      targetScreen.classList.add('active');
      this.activeScreen = screenId;
    }

    // Scroll para o topo interno
    document.getElementById('screen-container').scrollTop = 0;

    // Controla visibilidade e estado da Navbar Inferior
    const mainNavbar = document.getElementById('app-main-navbar');
    const noNavbarScreens = ['screen-splash', 'screen-terms', 'screen-login', 'screen-scanner', 'screen-emergency'];
    
    if (noNavbarScreens.includes(screenId) || !this.currentUser || !this.currentUser.cpf) {
      mainNavbar.style.display = 'none';
      if (this.navbarHideTimeout) {
        clearTimeout(this.navbarHideTimeout);
        this.navbarHideTimeout = null;
      }
    } else {
      mainNavbar.style.display = 'flex';
      this.resetNavbarTimer();
      
      // Atualiza botão ativo na navbar
      document.querySelectorAll('.nav-item').forEach(item => {
        const itemTarget = item.getAttribute('data-target');
        if (itemTarget === screenId || 
           (screenId === 'screen-vault' && itemTarget === 'screen-vault') ||
           (screenId === 'screen-edit-profile' && itemTarget === 'screen-profile') ||
           (screenId === 'screen-new-address' && itemTarget === 'screen-profile') ||
           (screenId === 'screen-purchase-history' && itemTarget === 'screen-profile')) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    }

    // Ações de renderização sob demanda
    if (screenId === 'screen-home') {
      this.updateHomeRoutineCard();
      this.updateProfileUI();
    } else if (screenId === 'screen-cart') {
      const btnBackCart = document.getElementById('btn-back-cart');
      if (prevScreenId === 'screen-quote-results') {
        btnBackCart.style.display = 'flex';
        btnBackCart.onclick = () => {
          // Apenas retorna para a tela, sem re-renderizar para preservar o estado exato
          this.navigateTo('screen-quote-results');
        };
      } else {
        btnBackCart.onclick = () => this.navigateTo('screen-home');
      }
      this.renderCart();
    } else if (screenId === 'screen-checkout') {
      this.renderCheckout();
    } else if (screenId === 'screen-edit-profile') {
      this.loadProfileFormData();
    } else if (screenId === 'screen-vault') {
      const vaultPrev = (prevScreenId === 'screen-profile') ? 'screen-profile' : 'screen-home';
      this._vaultPrevScreen = vaultPrev;
      const vaultLabel = document.getElementById('vault-back-label');
      if (vaultLabel) vaultLabel.textContent = (vaultPrev === 'screen-profile') ? 'Perfil' : 'Início';
      this.renderVault();
    } else if (screenId === 'screen-profile') {
      this.renderProfileAddresses();
    } else if (screenId === 'screen-schedule') {
      this.renderSchedule();
    } else if (screenId === 'screen-new-address') {
      const prevId = prevScreenId || 'screen-profile';
      document.getElementById('btn-back-new-address').setAttribute('data-prev', prevId);
      document.getElementById('btn-back-new-address').onclick = () => this.navigateTo(prevId);
      
      const titleEl = document.querySelector('#screen-new-address h2');
      const saveBtn = document.getElementById('btn-save-address');
      
      if (this.editingAddressId) {
        if (titleEl) titleEl.textContent = 'Editar Endereço';
        if (saveBtn) saveBtn.textContent = 'Salvar Alterações';
        const addr = this.addresses.find(a => a.id === this.editingAddressId);
        if (addr) {
          document.getElementById('addr-cep').value = addr.cep || '';
          document.getElementById('addr-street').value = addr.street || '';
          document.getElementById('addr-number').value = addr.number || '';
          document.getElementById('addr-complement').value = addr.complement || '';
          document.getElementById('addr-neighborhood').value = addr.neighborhood || '';
        }
      } else {
        if (titleEl) titleEl.textContent = 'Novo Endereço';
        if (saveBtn) saveBtn.textContent = 'Salvar Endereço';
        document.getElementById('addr-cep').value = '';
        document.getElementById('addr-street').value = '';
        document.getElementById('addr-number').value = '';
        document.getElementById('addr-complement').value = '';
        document.getElementById('addr-neighborhood').value = '';
      }
    } else if (screenId === 'screen-emergency') {
      this._emergencyPrevScreen = prevScreenId;
      this.renderEmergencyScreen();
    } else if (screenId === 'screen-purchase-history') {
      const historyPrev = (prevScreenId === 'screen-profile') ? 'screen-profile' : 'screen-home';
      this._historyPrevScreen = historyPrev;
      const historyLabel = document.getElementById('history-back-label');
      if (historyLabel) historyLabel.textContent = (historyPrev === 'screen-profile') ? 'Perfil' : 'Início';
      this.renderPurchaseHistory();
    } else if (screenId === 'screen-prescription-detail') {
      const backBtn = document.getElementById('btn-back-prescription-detail');
      if (backBtn) {
        backBtn.onclick = () => this.navigateTo('screen-scanner');
        const backLabel = document.getElementById('prescription-detail-back-label');
        if (backLabel) backLabel.textContent = 'Voltar';
      }
    } else if (screenId === 'screen-quote-results') {
      const backBtn = document.getElementById('btn-back-quote');
      if (backBtn) {
        backBtn.onclick = () => this.navigateTo('screen-prescription-detail');
      }
    }

    // Limpa a flag flash-update após o render
    if (this._flashUpdate) {
      setTimeout(() => {
        this._flashUpdate = false;
        document.querySelectorAll('.flash-update').forEach(el => el.classList.remove('flash-update'));
      }, 600);
    }
  }

  resetNavbarTimer() {
    const mainNavbar = document.getElementById('app-main-navbar');
    if (!mainNavbar || mainNavbar.style.display === 'none') {
      return;
    }
    
    mainNavbar.classList.remove('nav-hidden');
    
    if (this.navbarHideTimeout) {
      clearTimeout(this.navbarHideTimeout);
    }
    
    this.navbarHideTimeout = setTimeout(() => {
      mainNavbar.classList.add('nav-hidden');
    }, 8000);
  }

  updateProfileUI() {
    const nameVal = document.getElementById('profile-name-val');
    const cpfVal = document.getElementById('profile-cpf-val');
    const homeUsername = document.getElementById('home-username');
    const ageVal = document.getElementById('profile-age-val');

    if (this.currentUser) {
      if (nameVal) nameVal.textContent = this.currentUser.name || 'Visitante';
      if (cpfVal) cpfVal.textContent = `CPF: ${this.currentUser.cpf || '000.000.000-00'}`;
      if (homeUsername) homeUsername.textContent = this.currentUser.name ? this.currentUser.name.split(' ')[0] : 'Visitante';
      
      if (ageVal) {
        if (this.currentUser.birthdate) {
          const age = this.calculateAge(this.currentUser.birthdate);
          ageVal.textContent = `${age} anos • Sexo: ${this.currentUser.sex === 'M' ? 'Masculino' : this.currentUser.sex === 'F' ? 'Feminino' : 'Não informado'}`;
        } else {
          ageVal.textContent = 'Perfil incompleto';
        }
      }
    }
  }

  // ---- PERFIL AMPLIADO ----
  loadProfileFormData() {
    if (!this.currentUser) return;
    
    // Dados Básicos
    document.getElementById('edit-name').value = this.currentUser.name || '';
    document.getElementById('edit-cpf').value = this.currentUser.cpf || '';
    
    // Data Nasc e Sexo
    document.getElementById('edit-birthdate').value = this.currentUser.birthdate || '';
    document.getElementById('edit-sex').value = this.currentUser.sex || '';
    this.updateAgeDisplay(this.currentUser.birthdate);
    
    // Condições de Saúde
    const conditions = this.currentUser.conditions || [];
    document.getElementById('health-diabetes').checked = conditions.includes('Diabetes');
    document.getElementById('health-hypertension').checked = conditions.includes('Hipertensão');
    document.getElementById('health-heart').checked = conditions.includes('Infarto/Cardíaco');
    document.getElementById('health-kidney').checked = conditions.includes('Renal');
    document.getElementById('health-asthma').checked = conditions.includes('Asma/Pulmão');
    document.getElementById('health-thyroid').checked = conditions.includes('Tireoide');
    document.getElementById('edit-other-conditions').value = this.currentUser.otherConditions || '';
    
    // Alergias
    this.renderAllergyChips();
    
    // Convênio e Tipo Sanguíneo
    document.getElementById('edit-blood-type').value = this.currentUser.bloodType || '';
    document.getElementById('edit-insurance-name').value = this.currentUser.insuranceName || '';
    document.getElementById('edit-insurance-number').value = this.currentUser.insuranceNumber || '';
    document.getElementById('edit-insurance-code').value = this.currentUser.insuranceCode || '';
    
    // Observações
    document.getElementById('edit-medical-notes').value = this.currentUser.medicalNotes || '';
  }
  
  saveProfileFormData() {
    const name = document.getElementById('edit-name').value.trim();
    if (!name) return false;
    
    this.currentUser.name = name;
    this.currentUser.birthdate = document.getElementById('edit-birthdate').value;
    this.currentUser.sex = document.getElementById('edit-sex').value;
    
    const conditions = [];
    if (document.getElementById('health-diabetes').checked) conditions.push('Diabetes');
    if (document.getElementById('health-hypertension').checked) conditions.push('Hipertensão');
    if (document.getElementById('health-heart').checked) conditions.push('Infarto/Cardíaco');
    if (document.getElementById('health-kidney').checked) conditions.push('Renal');
    if (document.getElementById('health-asthma').checked) conditions.push('Asma/Pulmão');
    if (document.getElementById('health-thyroid').checked) conditions.push('Tireoide');
    
    this.currentUser.conditions = conditions;
    this.currentUser.otherConditions = document.getElementById('edit-other-conditions').value.trim();
    this.currentUser.bloodType = document.getElementById('edit-blood-type').value;
    this.currentUser.insuranceName = document.getElementById('edit-insurance-name').value.trim();
    this.currentUser.insuranceNumber = document.getElementById('edit-insurance-number').value.trim();
    this.currentUser.insuranceCode = document.getElementById('edit-insurance-code').value.trim();
    this.currentUser.medicalNotes = document.getElementById('edit-medical-notes').value.trim();
    
    this.saveUser();
    return true;
  }
  
  calculateAge(birthdateStr) {
    if (!birthdateStr) return 0;
    const today = new Date();
    const birthDate = new Date(birthdateStr);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  updateAgeDisplay(birthdateStr) {
    const ageDisplay = document.getElementById('edit-age-display');
    const ageText = document.getElementById('edit-age-text');
    
    if (!birthdateStr) {
      ageDisplay.style.display = 'none';
      return;
    }
    
    const age = this.calculateAge(birthdateStr);
    
    if (age < 0 || age > 120) {
      ageText.textContent = "Data inválida";
      ageDisplay.style.color = "var(--error)";
    } else {
      ageText.textContent = `${age} anos`;
      ageDisplay.style.color = "var(--primary)";
    }
    ageDisplay.style.display = 'block';
  }

  renderAllergyChips() {
    const container = document.getElementById('allergy-chips-container');
    container.innerHTML = '';
    
    if (!this.currentUser.allergies || this.currentUser.allergies.length === 0) {
      container.innerHTML = '<span style="font-size: 12px; color: var(--on-surface-variant);">Nenhuma alergia cadastrada.</span>';
      return;
    }
    
    this.currentUser.allergies.forEach((allergy, index) => {
      const chip = document.createElement('div');
      chip.className = 'allergy-chip';
      chip.innerHTML = `
        ${allergy}
        <button onclick="app.removeAllergy(${index})" title="Remover"><span class="material-symbols-outlined">close</span></button>
      `;
      container.appendChild(chip);
    });
  }
  
  removeAllergy(index) {
    if (this.currentUser.allergies) {
      this.currentUser.allergies.splice(index, 1);
      this.saveUser();
      this.renderAllergyChips();
    }
  }

  renderProfileAddresses() {
    const container = document.getElementById('profile-addresses-container');
    if (!container) return;

    container.innerHTML = '';

    if (this.addresses.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 16px; color: var(--on-surface-variant); font-size: 13px; background-color: var(--surface-container-lowest); border: 1px solid var(--surface-container); border-radius: var(--radius-default);">
          Nenhum endereço cadastrado.
        </div>
      `;
      return;
    }

    this.addresses.forEach((addr, idx) => {
      const isPrimary = idx === 0;
      const card = document.createElement('div');
      card.className = 'cart-item-card';
      card.style.margin = '0';
      card.style.padding = '12px 16px';
      
      const badgeText = isPrimary ? 'Principal' : `Endereço ${idx + 1}`;
      const badgeBg = isPrimary ? 'var(--primary-container)' : 'var(--surface-container-high)';
      const badgeColor = isPrimary ? 'var(--on-primary-container)' : 'var(--secondary)';

      card.innerHTML = `
        <div class="cart-item-left" style="align-items: flex-start; flex-direction: column; gap: 4px; flex: 1;">
          <span style="font-size: 10px; font-weight: 800; background-color: ${badgeBg}; color: ${badgeColor}; padding: 2px 8px; border-radius: var(--radius-full); width: fit-content;">${badgeText}</span>
          <div style="font-size: 13px; font-weight: 700; color: var(--on-surface); text-align: left; line-height: 1.4;">
            ${addr.street}, ${addr.number} ${addr.complement ? '- ' + addr.complement : ''}<br>
            <span style="font-size: 11px; color: var(--on-surface-variant); font-weight: 500;">${addr.neighborhood}, ${addr.city} - ${addr.state} • CEP ${addr.cep}</span>
          </div>
        </div>
        <div class="cart-item-right" style="align-self: center; display: flex; gap: 8px;">
          <button class="remove-item-btn" onclick="app.editAddress('${addr.id}')" title="Editar endereço" style="color: var(--primary); background: none; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%;">
            <span class="material-symbols-outlined" style="font-size:20px;">edit</span>
          </button>
          <button class="remove-item-btn" onclick="app.removeAddress('${addr.id}')" title="Excluir endereço" ${this.addresses.length === 1 ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>
            <span class="material-symbols-outlined" style="font-size:20px;">delete</span>
          </button>
        </div>
      `;
      container.appendChild(card);
    });
  }

  removeAddress(addrId) {
    if (this.addresses.length <= 1) {
      alert("Você precisa manter pelo menos um endereço cadastrado.");
      return;
    }
    if (confirm("Deseja realmente excluir este endereço?")) {
      this.addresses = this.addresses.filter(a => a.id !== addrId);
      this.saveAddresses();
      this.renderProfileAddresses();
      // Se estiver na tela do carrinho, atualiza também
      if (this.activeScreen === 'screen-cart') {
        this.renderCart();
      }
    }
  }

  openAddAddressScreen() {
    this.editingAddressId = null;
    this.navigateTo('screen-new-address');
  }

  editAddress(addrId) {
    this.editingAddressId = addrId;
    this.navigateTo('screen-new-address');
  }

  // ----------------------------------------------------
  // ANIMAÇÃO DO SCANNER E PROCESSAMENTO OCR MOCADO
  // ----------------------------------------------------
  loadPresetPrescription(presetKey) {
    const preset = PRESCRIPTION_PRESETS[presetKey];
    if (!preset) return;
    
    // Atualiza preview da câmera
    document.getElementById('camera-mock-preview').src = preset.scanImage;
    
    // Dispara a simulação de OCR
    this.runOCRSimulation(presetKey);
  }

  runOCRSimulation(presetKey) {
    const laser = document.getElementById('camera-laser-line');
    const overlay = document.getElementById('global-loading-overlay');
    const overlayText = document.getElementById('global-loading-text');

    // Liga animação do laser no viewfinder
    laser.style.display = 'block';
    
    setTimeout(() => {
      // Ativa overlay de processamento geral
      overlay.classList.add('active');
      overlayText.textContent = "Lendo receita médica...";
      
      setTimeout(() => {
        overlayText.textContent = "Analisando medicamentos...";
        
        setTimeout(() => {
          overlayText.textContent = "Calculando preços de cotação...";
          
          setTimeout(() => {
            // Desliga loaders
            overlay.classList.remove('active');
            laser.style.display = 'none';
            
            // Salva dados da cotação ativa
            const preset = PRESCRIPTION_PRESETS[presetKey];
            
            // Verifica se há medicamentos controlados/tarja preta (requiresPrescription)
            const controlledMeds = preset.medicines.filter(medId => {
              const item = MEDICINES_CATALOG.find(c => c.id === medId);
              return item && item.requiresPrescription;
            });

            if (controlledMeds.length > 0) {
              const names = controlledMeds.map(medId => {
                const item = MEDICINES_CATALOG.find(c => c.id === medId);
                return item ? item.name : medId;
              }).join(", ");
              alert(`Esta receita possui medicamentos de venda controlada (tarja preta/restritos): ${names}.\nA cotação prosseguirá incluindo estes medicamentos, e a receita física original será retida na entrega.`);
            }

            // Não filtra os controlados para permitir a cotação simulada deles
            const allowedMeds = [...preset.medicines];

            const extractedPrescription = {
              title: preset.title,
              medicines: allowedMeds,
              scanImage: preset.scanImage,
              date: new Date().toLocaleDateString('pt-BR'),
              doctorName: preset.doctorName,
              doctorSpecialty: preset.doctorSpecialty,
              presetKey: presetKey
            };
            
            this.renderPrescriptionDetail(extractedPrescription);
            this.navigateTo('screen-prescription-detail');
            
          }, 1000);
        }, 1000);
      }, 1000);
    }, 500);
  }

  savePrescriptionToVault(prescription) {
    // Evita duplicados idênticos seguidos
    const duplicate = this.vault.some(v => v.title === prescription.title && v.date === prescription.date);
    if (!duplicate) {
      // Mapeia IDs de medicamentos para nomes legíveis
      const medNames = prescription.medicines.map(id => {
        const item = MEDICINES_CATALOG.find(c => c.id === id);
        return item ? item.name : id;
      });

      // Busca dados do médico no preset
      const presetKey = this.currentPrescriptionPresetKey();
      const preset = PRESCRIPTION_PRESETS[presetKey] || {};

      this.vault.unshift({
        id: 'v_' + Date.now(),
        title: prescription.title,
        date: prescription.date,
        doctorName: prescription.doctorName || preset.doctorName || "Dr. João Silva",
        doctorSpecialty: prescription.doctorSpecialty || preset.doctorSpecialty || "Cardiologista",
        medicines: medNames,
        presetKey: prescription.presetKey || presetKey
      });
      this.saveVault();
      return true;
    }
    return false;
  }

  renderPrescriptionDetail(prescription) {
    this.currentPrescription = prescription;
    const container = document.getElementById('prescription-detail-content');
    
    let medsHtml = prescription.medicines.map(m => {
      const catItem = MEDICINES_CATALOG.find(c => c.id === m);
      const name = catItem ? catItem.name : m;
      const tarjaPretaBadge = (catItem && catItem.isTarjaPreta) ? `
        <div class="controlled-badge" style="margin-top: 4px;">
          <span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">warning</span> 
          Tarja Preta - Receita Retida
        </div>` : '';
      const labBadge = (catItem && catItem.discountAgreement) ? `
        <div class="lab-discount-badge" style="margin-top: 4px; display: inline-flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 800; color: #446900; background: rgba(68, 105, 0, 0.1); padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(68, 105, 0, 0.2);">
          <span class="material-symbols-outlined" style="font-size: 12px;">card_membership</span>
          Desconto de Laboratório (${catItem.discountAgreement.discountPercentage}% OFF)
        </div>` : '';
      const progBadge = (catItem && catItem.progressivePromo) ? `
        <div class="promo-progressive-badge" style="margin-top: 4px; display: inline-flex; align-items: center; gap: 4px;">
          <span class="material-symbols-outlined" style="font-size: 12px;">sell</span>
          Desconto Progressivo
        </div>` : '';

      return `
      <div style="background-color: var(--surface-container-low); padding: 12px; border-radius: 8px; margin-bottom: 8px; display: flex; flex-direction: column; align-items: flex-start; gap: 4px;">
        <span style="font-size: 14px; font-weight: 700; color: var(--on-surface);">${name}</span>
        <div style="display: flex; flex-wrap: wrap; gap: 6px; width: 100%;">
          ${tarjaPretaBadge}
          ${labBadge}
          ${progBadge}
        </div>
      </div>
      `;
    }).join('');

    container.innerHTML = `
      <div style="background-color: var(--primary-container); color: var(--on-primary-container); padding: 16px; border-radius: 12px; margin-bottom: 20px;">
        <h3 style="font-size: 16px; font-weight: 800; margin: 0 0 4px 0;">${prescription.doctorName || "Dr. João Silva"}</h3>
        <p style="font-size: 12px; opacity: 0.8; margin: 0 0 8px 0;">${prescription.doctorSpecialty || "Especialidade"}</p>
        <div style="font-size: 11px; opacity: 0.9; display: flex; align-items: center; gap: 4px;">
          <span class="material-symbols-outlined" style="font-size: 14px;">calendar_today</span>
          Data da emissão: ${prescription.date}
        </div>
      </div>
      
      <h3 style="font-size: 14px; font-weight: 700; color: var(--secondary); margin-bottom: 12px;">Medicamentos Prescritos (${prescription.medicines.length})</h3>
      ${medsHtml}
      
      <div style="display: flex; gap: 12px; margin-top: 24px;">
        <button class="modal-btn secondary" style="flex: 1;" id="btn-save-vault">
          <span class="material-symbols-outlined" style="font-size:18px;">save</span> Cofre
        </button>
        <button class="modal-btn primary" style="flex: 2;" id="btn-start-quote">
          Fazer Cotação
        </button>
      </div>
    `;

    document.getElementById('btn-start-quote').onclick = () => {
      this._pendingOCR = prescription;
      
      const genListContainer = document.getElementById('quote-generics-list');
      if (genListContainer) {
        let genHtml = '';
        prescription.medicines.forEach(medId => {
          const catItem = MEDICINES_CATALOG.find(c => c.id === medId);
          if (catItem && catItem.generic) {
            genHtml += `
              <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--on-surface); cursor: pointer; padding: 4px 0;">
                <input type="checkbox" class="generic-filter-checkbox" value="${catItem.id}" checked style="accent-color: var(--primary); width: 16px; height: 16px;">
                ${catItem.name}
              </label>
            `;
          }
        });
        if (genHtml === '') {
          genHtml = '<span style="font-size: 12px; color: var(--on-surface-variant);">Nenhum medicamento com versão genérica encontrado.</span>';
        }
        genListContainer.innerHTML = genHtml;
      }
      
      this.openModal('modal-ask-generics');
    };

    document.getElementById('btn-save-vault').onclick = () => {
      const saved = this.savePrescriptionToVault(prescription);
      const btn = document.getElementById('btn-save-vault');
      if (saved) {
        btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;">check</span> Salvo!';
        btn.style.backgroundColor = 'var(--primary-container)';
        btn.style.color = 'var(--primary)';
        btn.style.borderColor = 'var(--primary-container)';
      } else {
        btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;">check</span> Já salvo';
      }
    };
  }

  currentPrescriptionPresetKey() {
    // Retorna a chave com base no conteúdo
    const meds = this.currentPrescription.medicines;
    if (meds.includes('clonazepam') && meds.includes('prednisona')) return 'preset4';
    if (meds.includes('clonazepam')) return 'preset2';
    if (meds.includes('pantoprazol')) return 'preset3';
    if (meds.includes('atorvastatina')) return 'preset1';
    return 'preset1';
  }

  // ----------------------------------------------------
  // LOGICA E RENDERIZAÇÃO DE COMPARAÇÃO DE PREÇOS
  // ----------------------------------------------------
  renderQuotationResults() {
    const container = document.getElementById('quote-results-list-container');
    container.innerHTML = '';
    
    const optionsBox = document.getElementById('quote-options-box');
    optionsBox.innerHTML = '';

    if (!this.currentPrescription) {
      container.innerHTML = '<div class="vault-empty">Nenhuma receita cotada. Volte e escaneie.</div>';
      return;
    }

    const medsList = this.currentPrescription.medicines;
    
    // Função helper para pegar o preço e nome com base na escolha de genérico e na farmácia
    const getBestItemOption = (catalogItem, pharmId) => {
      const origPrice = catalogItem.prices[pharmId];
      const key = `${pharmId}_${catalogItem.id}`;
      
      if (this.selectedGenerics[key] === undefined) {
        this.selectedGenerics[key] = false;
      }

      const useGen = this.selectedGenerics[key];
      if (!useGen || !catalogItem.generic || !catalogItem.generic.prices[pharmId]) {
        return { price: origPrice, isGeneric: false, name: catalogItem.name, id: catalogItem.id };
      }
      const genPrice = catalogItem.generic.prices[pharmId];
      return { price: genPrice, isGeneric: true, name: catalogItem.generic.name, id: catalogItem.id };
    };

    // Calcula todas as Cestas Únicas primeiro (necessário para ambas as abas)
    const pharmacyBaskets = PHARMACIES.map(pharm => {
      let items = [];
      let totalMedPrice = 0;
      let allFound = true;

      medsList.forEach(medId => {
        const catalogItem = MEDICINES_CATALOG.find(c => c.id === medId);
        if (catalogItem && (catalogItem.prices[pharm.id] || (catalogItem.generic && catalogItem.generic.prices[pharm.id]))) {
          const opt = getBestItemOption(catalogItem, pharm.id);
          const qty = this.selectedQuantities[catalogItem.id] || 1;
          
          let itemSubtotal = opt.price * qty;
          
          // Promoção progressiva
          let hasPromo = false;
          if (catalogItem.progressivePromo && catalogItem.progressivePromo.prices) {
            const promoPrices = catalogItem.progressivePromo.prices;
            let promoTotal = null;
            if (promoPrices[qty]) {
              promoTotal = promoPrices[qty];
            } else {
              const maxPromoQty = Math.max(...Object.keys(promoPrices).map(Number));
              if (qty > maxPromoQty) {
                promoTotal = promoPrices[maxPromoQty] + (qty - maxPromoQty) * opt.price;
              }
            }
            if (promoTotal !== null && promoTotal < itemSubtotal) {
              itemSubtotal = promoTotal;
              hasPromo = true;
            }
          }

          // Desconto do convênio progressivo por quantidade (PBM)
          let hasDiscount = false;
          if (!hasPromo && catalogItem.discountAgreement && qty >= catalogItem.discountAgreement.minQuantity) {
            const discountVal = itemSubtotal * (catalogItem.discountAgreement.discountPercentage / 100);
            itemSubtotal -= discountVal;
            hasDiscount = true;
          }

          totalMedPrice += itemSubtotal;
          items.push({
            name: opt.name,
            price: opt.price,
            isGeneric: opt.isGeneric,
            found: true,
            origId: catalogItem.id,
            quantity: qty,
            itemSubtotal: itemSubtotal,
            discountApplied: hasDiscount || hasPromo
          });
        } else {
          allFound = false;
          items.push({ name: medId, found: false, origId: medId, quantity: 1, itemSubtotal: 0, discountApplied: false });
        }
      });

      const totalOrder = totalMedPrice + pharm.deliveryFee;

      return { pharmacy: pharm, items, totalMedPrice, totalOrder, allFound };
    });

    // Ordena do menor preço total para o maior
    const sortedByPrice = [...pharmacyBaskets].sort((a, b) => a.totalOrder - b.totalOrder);
    const bestSingleBasket = sortedByPrice[0];
    const worstSingleBasket = sortedByPrice[sortedByPrice.length - 1];

    if (!this.pharmacyFixedOrder) {
      this.pharmacyFixedOrder = sortedByPrice.map(b => b.pharmacy.id);
    }
    
    // Ordena as cestas para visualização de acordo com a ordem inicial fixada
    pharmacyBaskets.sort((a, b) => {
      return this.pharmacyFixedOrder.indexOf(a.pharmacy.id) - this.pharmacyFixedOrder.indexOf(b.pharmacy.id);
    });

    // RENDERIZA A LISTAGEM SIMPLES DOS MEDICAMENTOS PRESCRITOS NO TOPO (Sem Controles de Quantidade)
    medsList.forEach(medId => {
      const catalogItem = MEDICINES_CATALOG.find(c => c.id === medId);
      if (!catalogItem) return;

      let promoBadgeHtml = '';
      if (catalogItem.progressivePromo && catalogItem.progressivePromo.prices) {
        promoBadgeHtml = `<div class="promo-progressive-badge" style="margin-top: 4px;">
          <span class="material-symbols-outlined" style="font-size: 12px;">sell</span>
          Desconto disponível para 2+ unidades
        </div>`;
      }

      const medCard = document.createElement('div');
      medCard.className = 'glassmorphism-card';
      medCard.style.display = 'flex';
      medCard.style.justifyContent = 'space-between';
      medCard.style.alignItems = 'center';
      medCard.style.padding = '12px 14px';
      medCard.style.marginBottom = '8px';
      medCard.innerHTML = `
        <div>
          <h4 style="font-size: 10px; font-weight: 700; color: var(--secondary); margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">Medicamento Prescrito</h4>
          <h3 style="font-size: 14px; font-weight: 800; color: var(--on-surface); margin: 2px 0 0 0;">${catalogItem.name}</h3>
          ${promoBadgeHtml}
        </div>
        <span style="font-size: 11px; font-weight: 700; color: var(--primary); background: var(--primary-container); padding: 4px 10px; border-radius: 12px; display: flex; align-items: center; gap: 4px;">
          <span class="material-symbols-outlined" style="font-size: 14px;">description</span>
          Prescrito
        </span>
      `;
      optionsBox.appendChild(medCard);
    });

    if (this.quoteResultTab === 'single') {
      // 1. ABA CESTA ÚNICA: Exibir todas ordenadas pela ordem inicial
      pharmacyBaskets.forEach((basket, idx) => {
        // Agora isBest é avaliado pelo ID e não pela posição idx === 0
        const isBest = basket.pharmacy.id === bestSingleBasket.pharmacy.id;
        const card = document.createElement('div');
        card.className = `pharmacy-result-card ${isBest ? 'highlight' : ''}`;
        
        let itemsHtml = '';
        basket.items.forEach(item => {
          if (!item.found) {
            itemsHtml += `
              <div class="basket-item-row not-found" style="margin-bottom: 8px; padding: 6px 0; border-bottom: 1px dashed rgba(0,0,0,0.05);">
                <div>${item.quantity}x ${item.name}</div>
                <span style="color: var(--error); font-weight: 700;">Não encontrado</span>
              </div>
            `;
            return;
          }

          const catalogItem = MEDICINES_CATALOG.find(c => c.id === item.origId);
          const keyGen = `${basket.pharmacy.id}_${item.origId}`;
          const isGenericChosen = this.selectedGenerics[keyGen];

          const origPrice = catalogItem.prices[basket.pharmacy.id];
          const genPrice = (catalogItem.generic && catalogItem.generic.prices[basket.pharmacy.id]) ? catalogItem.generic.prices[basket.pharmacy.id] : null;

          let origSubtotal = origPrice * item.quantity;
          let genSubtotal = genPrice ? genPrice * item.quantity : null;

          // Promoção progressiva para original
          let origHasPromo = false;
          if (catalogItem.progressivePromo && catalogItem.progressivePromo.prices) {
            const promoPrices = catalogItem.progressivePromo.prices;
            let promoTotal = null;
            if (promoPrices[item.quantity]) {
              promoTotal = promoPrices[item.quantity];
            } else {
              const maxPromoQty = Math.max(...Object.keys(promoPrices).map(Number));
              if (item.quantity > maxPromoQty) {
                promoTotal = promoPrices[maxPromoQty] + (item.quantity - maxPromoQty) * origPrice;
              }
            }
            if (promoTotal !== null && promoTotal < origSubtotal) {
              origSubtotal = promoTotal;
              origHasPromo = true;
            }
          }

          // Promoção progressiva para genérico
          let genHasPromo = false;
          if (genPrice && catalogItem.progressivePromo && catalogItem.progressivePromo.prices) {
            const promoPrices = catalogItem.progressivePromo.prices;
            let promoTotal = null;
            if (promoPrices[item.quantity]) {
              promoTotal = promoPrices[item.quantity];
            } else {
              const maxPromoQty = Math.max(...Object.keys(promoPrices).map(Number));
              if (item.quantity > maxPromoQty) {
                promoTotal = promoPrices[maxPromoQty] + (item.quantity - maxPromoQty) * genPrice;
              }
            }
            if (promoTotal !== null && promoTotal < genSubtotal) {
              genSubtotal = promoTotal;
              genHasPromo = true;
            }
          }

          // Desconto convênio (PBM) se aplicável
          let origDiscBadge = '';
          if (!origHasPromo && catalogItem.discountAgreement && item.quantity >= catalogItem.discountAgreement.minQuantity) {
            const discountVal = origSubtotal * (catalogItem.discountAgreement.discountPercentage / 100);
            origSubtotal -= discountVal;
            origDiscBadge = `<span style="color:var(--primary); font-size:9px; font-weight:700;">(PBM)</span>`;
          } else if (origHasPromo) {
            origDiscBadge = `<span style="color:#32bcad; font-size:9px; font-weight:700;">(Promo)</span>`;
          }

          let genDiscBadge = '';
          if (genPrice) {
            if (!genHasPromo && catalogItem.discountAgreement && item.quantity >= catalogItem.discountAgreement.minQuantity) {
              const discountVal = genSubtotal * (catalogItem.discountAgreement.discountPercentage / 100);
              genSubtotal -= discountVal;
              genDiscBadge = `<span style="color:var(--primary); font-size:9px; font-weight:700;">(PBM)</span>`;
            } else if (genHasPromo) {
              genDiscBadge = `<span style="color:#32bcad; font-size:9px; font-weight:700;">(Promo)</span>`;
            }
          }

          let optionsHtml = '';
          const showGenerics = this.allowedGenerics && this.allowedGenerics.includes(item.origId) && catalogItem.generic && genPrice;

          if (showGenerics) {
            const economia = origSubtotal - genSubtotal;
            optionsHtml += `
              <div style="padding: 12px; border-radius: var(--radius-sm); background: rgba(0,0,0,0.02); margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                  <span style="color: var(--on-surface-variant);">Referência:</span>
                  <span style="font-weight: 700; color: var(--on-surface);" class="${this._flashUpdate ? 'flash-update' : ''}">R$ ${origSubtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                  <span style="color: var(--on-surface-variant);">Genérico:</span>
                  <span style="font-weight: 700; color: var(--on-surface);" class="${this._flashUpdate ? 'flash-update' : ''}">R$ ${genSubtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 800; color: #32bcad; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px dashed rgba(0,0,0,0.1);">
                  <span>Economia:</span>
                  <span>R$ ${economia.toFixed(2).replace('.', ',')}</span>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 6px;">
                  <label class="generic-choice-wrapper" onclick="app.changePharmacyGenericChoice('${basket.pharmacy.id}', '${item.origId}', false)" style="display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600; cursor: pointer; padding: 10px 12px; border-radius: 8px; background: ${!isGenericChosen ? '#e2ebd5' : '#ffffff'}; border: 1.5px solid ${!isGenericChosen ? 'var(--secondary)' : 'var(--outline-variant)'}; color: var(--on-surface);">
                    <input type="radio" name="choice_${basket.pharmacy.id}_${item.origId}" value="original" ${!isGenericChosen ? 'checked' : ''} style="accent-color: var(--secondary); pointer-events: none; width: 16px; height: 16px;">
                    <span style="pointer-events: none; color: var(--on-surface);">Escolher Referência ${origDiscBadge}</span>
                  </label>
                  <label class="generic-choice-wrapper" onclick="app.changePharmacyGenericChoice('${basket.pharmacy.id}', '${item.origId}', true)" style="display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600; cursor: pointer; padding: 10px 12px; border-radius: 8px; background: ${isGenericChosen ? '#e2ebd5' : '#ffffff'}; border: 1.5px solid ${isGenericChosen ? 'var(--secondary)' : 'var(--outline-variant)'}; color: var(--on-surface);">
                    <input type="radio" name="choice_${basket.pharmacy.id}_${item.origId}" value="generic" ${isGenericChosen ? 'checked' : ''} style="accent-color: var(--secondary); pointer-events: none; width: 16px; height: 16px;">
                    <span style="pointer-events: none; color: var(--on-surface);">Escolher Genérico ${genDiscBadge}</span>
                  </label>
                </div>
              </div>
            `;
          } else {
            // Static Reference Option (no radio, pre-selected style)
            optionsHtml += `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; border-radius: var(--radius-sm); background: rgba(68, 105, 0, 0.05); border: 1px solid var(--primary); margin-bottom: 4px;">
                <span style="font-size: 12px; font-weight: 600; color: var(--on-surface);">
                  <span>${catalogItem.name} ${origDiscBadge}</span>
                </span>
                <span style="font-size: 12px; font-weight: 700; color: var(--primary);">R$ ${origSubtotal.toFixed(2).replace('.', ',')}</span>
              </div>
            `;
          }

          // Progressive Promotion Highlight Box
          let itemPromoHighlightHtml = '';
          if (catalogItem.progressivePromo && catalogItem.progressivePromo.prices) {
            const currentSelectedPrice = isGenericChosen ? genPrice : origPrice;
            if (currentSelectedPrice) {
              itemPromoHighlightHtml = `
                <div style="margin-top: 6px; padding: 8px 10px; border-radius: 6px; background-color: rgba(50, 188, 173, 0.06); border: 1px dashed #32bcad; font-size: 11px; text-align: left;">
                  <div style="color: #32bcad; font-weight: 800; font-size: 11px; display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                    <span class="material-symbols-outlined" style="font-size: 14px;">campaign</span>
                    <span>Promoção Progressiva Disponível</span>
                  </div>
              `;
              Object.entries(catalogItem.progressivePromo.prices).forEach(([qStr, promoPrice]) => {
                const q = Number(qStr);
                const individualCost = currentSelectedPrice * q;
                const savings = individualCost - promoPrice;
                if (savings > 0) {
                  itemPromoHighlightHtml += `
                    <div style="display: flex; justify-content: space-between; font-weight: 600; color: var(--on-surface-variant); margin-top: 2px;">
                      <span>Leve ${q} unidades:</span>
                      <span style="color: #32bcad; font-weight: 800;">R$ ${promoPrice.toFixed(2).replace('.', ',')} (economize R$ ${savings.toFixed(2).replace('.', ',')})</span>
                    </div>
                  `;
                } else {
                  itemPromoHighlightHtml += `
                    <div style="display: flex; justify-content: space-between; font-weight: 600; color: var(--on-surface-variant); margin-top: 2px;">
                      <span>Leve ${q} unidades:</span>
                      <span style="color: #32bcad; font-weight: 800;">R$ ${promoPrice.toFixed(2).replace('.', ',')}</span>
                    </div>
                  `;
                }
              });
              itemPromoHighlightHtml += `</div>`;
            }
          }

          const tarjaPretaBadge = (catalogItem && catalogItem.isTarjaPreta) ? `
            <div class="controlled-badge" style="margin-bottom: 4px; display:inline-flex;">
              <span class="material-symbols-outlined" style="font-size: 12px; color: #f59e0b;">warning</span> 
              Tarja Preta
            </div>` : '';

          itemsHtml += `
            <div style="margin-bottom: 12px; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 8px;">
              <div style="font-size: 11px; font-weight: 800; color: var(--secondary); margin-bottom: 4px; text-transform: uppercase;">
                ${item.quantity}x ${catalogItem.name}
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                ${tarjaPretaBadge}
                ${(catalogItem && catalogItem.progressivePromo && catalogItem.progressivePromo.prices) ? `<div class="promo-progressive-badge" style="margin-bottom: 4px; display:inline-flex;"><span class="material-symbols-outlined" style="font-size: 12px;">sell</span> Desconto para 2+ unidades</div>` : ''}
              </div>
              <div style="display: flex; flex-direction: column; gap: 2px;">
                ${optionsHtml}
              </div>
              ${itemPromoHighlightHtml}
            </div>
          `;
        });

        // Calcula economia se for a melhor
        let savingsHtml = '';
        const savings = worstSingleBasket.totalOrder - basket.totalOrder;
        if (isBest && savings > 0) {
          savingsHtml = `
            <div style="background-color: var(--primary-container); color: var(--on-primary-container); font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 12px; display: inline-flex; align-items: center; gap: 4px; margin-bottom: 12px;">
              <span class="material-symbols-outlined" style="font-size: 14px;">savings</span>
              Você economiza R$ ${savings.toFixed(2).replace('.', ',')} vs. a opção mais cara
            </div>
          `;
        }

        let purchaseActionHtml = '';
        if (isBest) {
          purchaseActionHtml = `
            <button class="select-basket-btn-primary" onclick="app.selectSingleBasket('${basket.pharmacy.id}')">COMPRAR</button>
          `;
        } else {
          const diff = basket.totalOrder - bestSingleBasket.totalOrder;
          purchaseActionHtml = `
            <button class="select-basket-btn-secondary" onclick="app.selectSingleBasket('${basket.pharmacy.id}')">COMPRAR</button>
            <div style="font-size: 11px; color: var(--on-surface-variant); font-weight: 600; text-align: center; margin-top: 6px;">
              +R$ ${diff.toFixed(2).replace('.', ',')} em relação ao melhor preço
            </div>
          `;
        }

        card.innerHTML = `
          ${isBest ? '<div class="promo-tag" style="width:fit-content; margin-bottom:8px;">Melhor Preço</div>' : ''}
          <div class="pharmacy-result-header">
            <div class="pharmacy-info-left">
              <div class="pharmacy-logo-box">${basket.pharmacy.logo}</div>
              <div>
                <div style="display:flex; align-items:center; gap:6px;">
                  <h4 class="pharmacy-name-title">${basket.pharmacy.name}</h4>
                  ${!isBest ? `<span class="pharmacy-rank-badge" style="background:var(--surface-container-high); color:var(--secondary);">${idx + 1}º lugar</span>` : ''}
                </div>
                <div class="pharmacy-rating-row">
                  <span class="material-symbols-outlined filled">star</span>
                  ${basket.pharmacy.rating}
                </div>
              </div>
            </div>
            
            <div class="price-summary-right" style="text-align: right; display: flex; flex-direction: column; gap: 3px;">
              <span style="font-size: 11px; color: var(--on-surface-variant); font-weight: 600;">Subtotal: <span class="${this._flashUpdate ? 'flash-update' : ''}">R$ ${basket.totalMedPrice.toFixed(2).replace('.', ',')}</span></span>
              <span style="font-size: 11px; color: var(--on-surface-variant); font-weight: 600;">Frete: R$ ${basket.pharmacy.deliveryFee.toFixed(2).replace('.', ',')}</span>
              <span class="basket-total-price ${this._flashUpdate ? 'flash-update' : ''}" style="font-size: 18px; font-weight: 800; color: ${isBest ? 'var(--primary)' : 'var(--on-surface)'}; margin-top: 2px;">Total: R$ ${basket.totalOrder.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
          ${savingsHtml}
          
          <div class="pharmacy-basket-items" style="margin-top: 12px;">
            ${itemsHtml}
          </div>
          
          <div class="result-card-footer" style="flex-direction: column; gap: 12px; align-items: stretch;">
            <div class="delivery-estimate" style="align-self: flex-start;">
              <span class="material-symbols-outlined">schedule</span>
              Entrega em ${basket.pharmacy.deliveryTime}
            </div>
            <div style="width: 100%;">
              ${purchaseActionHtml}
            </div>
          </div>
        `;
        container.appendChild(card);
      });

    } else {
      // 2. ABA CESTA DIVIDIDA: Acha o menor preço de cada item individual
      let itemsSplit = [];
      let totalMedPrice = 0;
      let deliveryFeesMap = {};

      medsList.forEach(medId => {
        const catalogItem = MEDICINES_CATALOG.find(c => c.id === medId);
        if (!catalogItem) return;

        let bestPharm = null;
        let bestPrice = Infinity;
        let bestIsGeneric = false;
        let bestName = catalogItem.name;

        PHARMACIES.forEach(pharm => {
          const opt = getBestItemOption(catalogItem, pharm.id);
          const qty = this.selectedQuantities[catalogItem.id] || 1;
          
          let subTotal = opt.price * qty;
          
          // Progressive promo
          let hasPromo = false;
          if (catalogItem.progressivePromo && catalogItem.progressivePromo.prices) {
            const promoPrices = catalogItem.progressivePromo.prices;
            let promoTotal = null;
            if (promoPrices[qty]) {
              promoTotal = promoPrices[qty];
            } else {
              const maxPromoQty = Math.max(...Object.keys(promoPrices).map(Number));
              if (qty > maxPromoQty) {
                promoTotal = promoPrices[maxPromoQty] + (qty - maxPromoQty) * opt.price;
              }
            }
            if (promoTotal !== null && promoTotal < subTotal) {
              subTotal = promoTotal;
              hasPromo = true;
            }
          }

          // PBM Discount
          if (!hasPromo && catalogItem.discountAgreement && qty >= catalogItem.discountAgreement.minQuantity) {
            const discountVal = subTotal * (catalogItem.discountAgreement.discountPercentage / 100);
            subTotal -= discountVal;
          }

          const itemUnitPriceAfterDiscount = subTotal / qty;

          if (itemUnitPriceAfterDiscount && itemUnitPriceAfterDiscount < bestPrice) {
            bestPrice = itemUnitPriceAfterDiscount;
            bestPharm = pharm;
            bestIsGeneric = opt.isGeneric;
            bestName = opt.name;
          }
        });

        if (bestPharm) {
          const qty = this.selectedQuantities[catalogItem.id] || 1;
          
          let itemSubtotal = bestPrice * qty;
          
          // Re-calculate the promo/discount flags for the best selected option
          let hasPromo = false;
          let promoTotal = null;
          if (catalogItem.progressivePromo && catalogItem.progressivePromo.prices) {
            const promoPrices = catalogItem.progressivePromo.prices;
            if (promoPrices[qty]) {
              promoTotal = promoPrices[qty];
            } else {
              const maxPromoQty = Math.max(...Object.keys(promoPrices).map(Number));
              if (qty > maxPromoQty) {
                promoTotal = promoPrices[maxPromoQty] + (qty - maxPromoQty) * bestPrice;
              }
            }
            if (promoTotal !== null && promoTotal < itemSubtotal) {
              itemSubtotal = promoTotal;
              hasPromo = true;
            }
          }

          let hasDiscount = false;
          if (!hasPromo && catalogItem.discountAgreement && qty >= catalogItem.discountAgreement.minQuantity) {
            const discountVal = itemSubtotal * (catalogItem.discountAgreement.discountPercentage / 100);
            itemSubtotal -= discountVal;
            hasDiscount = true;
          }

          totalMedPrice += itemSubtotal;
          deliveryFeesMap[bestPharm.id] = bestPharm.deliveryFee;
          
          itemsSplit.push({
            medicineId: catalogItem.id,
            name: bestName,
            isGeneric: bestIsGeneric,
            price: bestPrice,
            quantity: qty,
            itemSubtotal: itemSubtotal,
            discountApplied: hasDiscount || hasPromo,
            pharmacy: bestPharm
          });
        }
      });

      let totalDeliveryFee = 0;
      let deliveryDetailsHtml = '';
      Object.keys(deliveryFeesMap).forEach(pharmId => {
        const pharm = PHARMACIES.find(p => p.id === pharmId);
        totalDeliveryFee += pharm.deliveryFee;
        deliveryDetailsHtml += `<div>• ${pharm.name}: R$ ${pharm.deliveryFee.toFixed(2).replace('.', ',')}</div>`;
      });

      const totalSplitOrder = totalMedPrice + totalDeliveryFee;

      // Verifica se a cesta dividida realmente compensa
      let splitSavingsHtml = '';
      if (bestSingleBasket && totalSplitOrder >= bestSingleBasket.totalOrder) {
        // NÃO COMPENSA
        const card = document.createElement('div');
        card.className = 'pharmacy-result-card';
        card.style.textAlign = 'center';
        card.innerHTML = `
          <div style="width:48px; height:48px; border-radius:50%; background-color:var(--surface-container-high); display:flex; align-items:center; justify-content:center; margin:0 auto 12px auto; color:var(--secondary);">
            <span class="material-symbols-outlined">info</span>
          </div>
          <h4 style="font-size:16px; font-weight:800; color:var(--on-surface); margin-bottom:8px;">A divisão não gera economia</h4>
          <p style="font-size:13px; color:var(--on-surface-variant); line-height:1.5; margin-bottom:16px;">
            Ao somar os fretes de múltiplas farmácias, o valor total ficaria <strong>R$ ${totalSplitOrder.toFixed(2).replace('.', ',')}</strong>.<br><br>
            Comprar tudo na <strong>${bestSingleBasket.pharmacy.name}</strong> por R$ ${bestSingleBasket.totalOrder.toFixed(2).replace('.', ',')} é a melhor opção.
          </p>
          <button class="form-btn" onclick="document.getElementById('tab-single-basket').click()">Ver Melhor Cesta Única</button>
        `;
        container.appendChild(card);
        return;
      }

      // COMPENSA
      const savings = bestSingleBasket.totalOrder - totalSplitOrder;
      if (savings > 0) {
        splitSavingsHtml = `
        <div style="display: flex; justify-content: center; margin-bottom: 12px;">
          <div style="background: var(--surface-container-lowest); border: 1px dashed #32bcad; padding: 12px 24px; border-radius: 12px; display: inline-block; text-align: center;">
            <span style="font-size: 18px; font-weight: 800; color: #32bcad; display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 4px;">
              <span class="material-symbols-outlined" style="font-size: 22px;">savings</span>
              💰 - R$ ${savings.toFixed(2).replace('.', ',')}
            </span>
            <span style="font-size: 10px; color: var(--on-surface-variant); font-weight: 600;">
              em relação à melhor Cesta Única
            </span>
          </div>
        </div>`;
      }
      
      const card = document.createElement('div');
      card.className = 'pharmacy-result-card highlight';
      
      let itemsHtml = '';
      itemsSplit.forEach(item => {
        const genBadge = item.isGeneric ? '<span class="generic-badge">Genérico</span>' : '';
        const discBadge = item.discountApplied ? '<span style="color:var(--primary); font-size:10px; font-weight:700;">(Desconto Aplicado)</span>' : '';
        itemsHtml += `
          <div class="basket-item-row" style="margin-bottom: 4px;">
            <div>
              <strong>${item.quantity}x ${item.name}</strong> ${genBadge}<br>
              ${discBadge}
              <span style="font-size:11px; color:var(--secondary)">Comprar na ${item.pharmacy.name}</span>
            </div>
            <span>R$ ${item.itemSubtotal.toFixed(2).replace('.', ',')}</span>
          </div>
        `;
      });

      card.innerHTML = `
        <div class="promo-tag" style="width:fit-content; margin-bottom:8px; background-color:var(--tertiary-container); color:var(--on-tertiary-container);">Cesta Dividida</div>
        <div class="pharmacy-result-header">
          <div class="pharmacy-info-left">
            <div class="pharmacy-logo-box" style="background-color:var(--tertiary-container); color:var(--on-tertiary-container);">🔀</div>
            <div>
              <h4 class="pharmacy-name-title">Compra Dividida Otimizada</h4>
              <div style="font-size:11px; color:var(--on-surface-variant); font-weight:600; margin-top:2px;">
                Itens divididos para maximizar a economia
              </div>
            </div>
          </div>
          
          <div class="price-summary-right" style="text-align: right; display: flex; flex-direction: column; gap: 3px;">
            <span style="font-size: 11px; color: var(--on-surface-variant); font-weight: 600;">Medicamentos: R$ ${totalMedPrice.toFixed(2).replace('.', ',')}</span>
            <span style="font-size: 11px; color: var(--on-surface-variant); font-weight: 600; cursor:pointer;" title="Clique para ver detalhes do frete">Frete Combinado: R$ ${totalDeliveryFee.toFixed(2).replace('.', ',')}</span>
            <span class="basket-total-price" style="font-size: 16px; font-weight: 800; color: var(--tertiary); margin-top: 2px;">Total: R$ ${totalSplitOrder.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
        
        ${splitSavingsHtml}
        
        <div style="font-size:10px; color:var(--on-surface-variant); background-color:var(--surface-container-low); padding:8px 12px; border-radius:6px; margin:10px 0 0 0; line-height:1.4;">
          <strong>Detalhamento dos Fretes:</strong>
          ${deliveryDetailsHtml}
        </div>
        
        <div class="pharmacy-basket-items" style="margin-top: 12px;">
          ${itemsHtml}
        </div>
        
        <div class="result-card-footer" style="flex-direction: column; gap: 12px; align-items: stretch;">
          <div class="delivery-estimate" style="align-self: flex-start;">
            <span class="material-symbols-outlined">schedule</span>
            Múltiplos prazos (consulte detalhes)
          </div>
          <button class="select-basket-btn-primary" onclick="app.selectSplitBasket()" style="background-color:var(--tertiary)">COMPRAR +R$ ${totalSplitOrder.toFixed(2).replace('.', ',')}</button>
        </div>
      `;
      container.appendChild(card);
    }
  }

  updateQuoteQty(medId, newQty) {
    if (newQty < 1) return;
    this.selectedQuantities[medId] = newQty;
    this.renderQuotationResults();
  }

  updateCartItemQty(idx, newQty) {
    if (newQty < 1) return;
    this.cart[idx].quantity = newQty;
    this.saveCart();
    this.renderCart();
    this.updateCartBadge();
  }

  changePharmacyGenericChoice(pharmId, medId, isGeneric) {
    const key = `${pharmId}_${medId}`;
    this.selectedGenerics[key] = isGeneric;
    
    // Adiciona flag para flash update na próxima renderização
    this._flashUpdate = true;
    
    this.renderQuotationResults();
  }

  // Ações de seleção de cotação
  selectSingleBasket(pharmacyId) {
    if (!this.currentPrescription) return;
    
    const pharm = PHARMACIES.find(p => p.id === pharmacyId);
    if (!pharm) return;

    // Converte os itens cotados em itens de carrinho
    const newItems = this.currentPrescription.medicines.map(medId => {
      const catalogItem = MEDICINES_CATALOG.find(c => c.id === medId);
      
      const key = `${pharmacyId}_${medId}`;
      if (this.selectedGenerics[key] === undefined) {
        this.selectedGenerics[key] = false;
      }
      const useGen = this.selectedGenerics[key];
      let finalPrice = catalogItem.prices[pharmacyId];
      let finalName = catalogItem.name;
      let isGen = false;
      
      if (useGen && catalogItem.generic && catalogItem.generic.prices[pharmacyId]) {
        finalPrice = catalogItem.generic.prices[pharmacyId];
        finalName = catalogItem.generic.name;
        isGen = true;
      }

      const qty = this.selectedQuantities[medId] || 1;

      return {
        type: 'quote',
        id: catalogItem.id, // Usa sempre o ID original para controle
        name: finalName,
        brand: catalogItem.brand,
        price: finalPrice,
        isGeneric: isGen,
        quantity: qty,
        pharmacyId: pharmacyId,
        image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=100' // mock medicine image
      };
    });

    // Limpa itens antigos do tipo 'quote' (cotação anterior) e adiciona os novos
    this.cart = this.cart.filter(item => item.type !== 'quote');
    this.cart.push(...newItems);
    this.saveCart();
    
    this.updateCartBadge();
    alert(`Cesta da ${pharm.name} adicionada ao seu carrinho!`);
    this.navigateTo('screen-cart');
  }

  selectSplitBasket() {
    if (!this.currentPrescription) return;

    const newItems = [];

    this.currentPrescription.medicines.forEach(medId => {
      const catalogItem = MEDICINES_CATALOG.find(c => c.id === medId);
      if (!catalogItem) return;

      let bestPharmId = null;
      let bestPrice = Infinity;
      let bestName = catalogItem.name;
      let bestIsGeneric = false;

      PHARMACIES.forEach(pharm => {
        const key = `${pharm.id}_${catalogItem.id}`;
        if (this.selectedGenerics[key] === undefined) {
          this.selectedGenerics[key] = false;
        }
        const useGen = this.selectedGenerics[key];
        
        let price = catalogItem.prices[pharm.id];
        let name = catalogItem.name;
        let isGen = false;
        
        if (useGen && catalogItem.generic && catalogItem.generic.prices[pharm.id]) {
          price = catalogItem.generic.prices[pharm.id];
          name = catalogItem.generic.name;
          isGen = true;
        }

        if (price && price < bestPrice) {
          bestPrice = price;
          bestPharmId = pharm.id;
          bestName = name;
          bestIsGeneric = isGen;
        }
      });

      const qty = this.selectedQuantities[catalogItem.id] || 1;

      if (bestPharmId) {
        newItems.push({
          type: 'quote',
          id: catalogItem.id,
          name: bestName,
          brand: catalogItem.brand,
          price: bestPrice,
          isGeneric: bestIsGeneric,
          quantity: qty,
          pharmacyId: bestPharmId,
          image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=100'
        });
      }
    });

    this.cart = this.cart.filter(item => item.type !== 'quote');
    this.cart.push(...newItems);
    this.saveCart();
    
    this.updateCartBadge();
    alert("Cesta Dividida Inteligente adicionada ao carrinho!");
    this.navigateTo('screen-cart');
  }

  // ----------------------------------------------------
  // LOGICA E RENDERIZAÇÃO DA LOJA (SHOP)
  // ----------------------------------------------------
  renderCategoryChips() {
    const container = document.getElementById('shop-categories-container');
    if (!container) return;
    container.innerHTML = '';

    const categories = ['all', 'Suplementos', 'Vitaminas', 'Dermocosméticos'];
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = `filter-chip ${this.selectedCategory === cat ? 'active' : ''}`;
      btn.textContent = cat === 'all' ? 'Todos' : cat;
      btn.setAttribute('data-category', cat);
      
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('#shop-categories-container .filter-chip').forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');
        this.selectedCategory = cat;
        this.renderShopProducts();
      });
      
      container.appendChild(btn);
    });
  }

  renderShopProducts() {
    const grid = document.getElementById('shop-products-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const orderFilter = document.getElementById('shop-filter-order') ? document.getElementById('shop-filter-order').value : 'default';
    const networkFilter = document.getElementById('shop-filter-network') ? document.getElementById('shop-filter-network').value : 'all';

    let filtered = SHOP_PRODUCTS.filter(prod => {
      const matchCat = this.selectedCategory === 'all' || prod.category === this.selectedCategory;
      const matchSearch = prod.name.toLowerCase().includes(this.searchQuery) || 
                          prod.description.toLowerCase().includes(this.searchQuery) ||
                          prod.category.toLowerCase().includes(this.searchQuery);
      const matchNetwork = networkFilter === 'all' || prod.pharmacyId === networkFilter;
      return matchCat && matchSearch && matchNetwork;
    });

    // Ordenação
    if (orderFilter === 'discount') {
      filtered.sort((a, b) => {
        const discA = a.discount ? parseInt(a.discount.replace('%', ''), 10) : 0;
        const discB = b.discount ? parseInt(b.discount.replace('%', ''), 10) : 0;
        return discB - discA;
      });
    } else if (orderFilter === 'price') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (orderFilter === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    }

    if (filtered.length === 0) {
      grid.innerHTML = '<div style="grid-column: span 2; text-align: center; padding: 40px; color: var(--on-surface-variant);">Nenhum produto encontrado.</div>';
      return;
    }

    filtered.forEach(prod => {
      const pharm = PHARMACIES.find(p => p.id === prod.pharmacyId);
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <div class="product-image-container" onclick="app.showProductDetails('${prod.id}')">
          <img src="${prod.image}" alt="${prod.name}">
          ${prod.discount ? `<span class="product-discount-badge">${prod.discount} OFF</span>` : ''}
        </div>
        <div class="product-info">
          <div class="product-category">${prod.category}</div>
          <h4 class="product-title" onclick="app.showProductDetails('${prod.id}')">${prod.name}</h4>
          <div class="product-partner">
            <span class="partner-logo-mini">${pharm.logo}</span>
            <span>${pharm.name}</span>
          </div>
          <div class="product-prices">
            <span class="product-price-current">R$ ${prod.price.toFixed(2).replace('.', ',')}</span>
            ${prod.originalPrice ? `<span class="product-price-original">R$ ${prod.originalPrice.toFixed(2).replace('.', ',')}</span>` : ''}
          </div>
          <button class="product-add-btn" onclick="app.addProductToCart('${prod.id}')">
            <span class="material-symbols-outlined" style="font-size:16px;">add_shopping_cart</span>
            Adicionar
          </button>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  showProductDetails(productId) {
    const prod = SHOP_PRODUCTS.find(p => p.id === productId);
    if (!prod) return;

    const pharm = PHARMACIES.find(p => p.id === prod.pharmacyId);
    const container = document.getElementById('product-detail-content');
    
    let promoBlock = '';
    if (prod.progressivePromo && prod.progressivePromo.prices) {
      promoBlock = `
        <div class="progressive-promo-box" style="margin-top: 15px; padding: 12px; border-radius: 8px; border: 1.5px dashed #32bcad; background-color: rgba(50, 188, 173, 0.05); text-align: left; margin-bottom: 15px;">
          <div style="display: flex; align-items: center; gap: 6px; color: #32bcad; font-weight: 800; font-size: 13px; margin-bottom: 8px;">
            <span class="material-symbols-outlined" style="font-size: 18px;">campaign</span>
            <span>Promoção Progressiva ${pharm.name}!</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
      `;
      Object.entries(prod.progressivePromo.prices).forEach(([qtyStr, price]) => {
        const qty = Number(qtyStr);
        const origCost = prod.price * qty;
        const savings = origCost - price;
        const unitPrice = price / qty;
        promoBlock += `
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 600; color: var(--on-surface);">
            <span>Compre ${qty} unidades:</span>
            <span style="font-weight: 800; color: #32bcad;">R$ ${price.toFixed(2).replace('.', ',')} (R$ ${unitPrice.toFixed(2).replace('.', ',')}/un) <span style="font-size: 10px; font-weight: 700; color: var(--primary);">[Economize R$ ${savings.toFixed(2).replace('.', ',')}]</span></span>
          </div>
        `;
      });
      promoBlock += `
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="detail-img-box">
        <img src="${prod.image}" alt="${prod.name}">
      </div>
      <div class="detail-info-card">
        <div class="detail-badge-row">
          <div class="detail-partner-badge">
            <span>${pharm.logo}</span>
            <span>Promovido por ${pharm.name}</span>
          </div>
          <div class="detail-rating">
            <span class="material-symbols-outlined filled">star</span>
            <strong>${prod.rating}</strong> (${prod.reviews} avaliações)
          </div>
        </div>
        <h3 class="detail-title">${prod.name}</h3>
        <div class="detail-prices">
          <span class="detail-price-curr">R$ ${prod.price.toFixed(2).replace('.', ',')}</span>
          ${prod.originalPrice ? `<span class="detail-price-orig">de R$ ${prod.originalPrice.toFixed(2).replace('.', ',')}</span>` : ''}
        </div>
        <h4 class="detail-desc-title">Características do Produto</h4>
        <p class="detail-desc-text">${prod.description}</p>
        
        ${promoBlock}
        
        <div class="detail-action-bar">
          <button class="detail-buy-btn" onclick="app.addProductToCart('${prod.id}', true)">
            <span class="material-symbols-outlined">shopping_cart</span>
            Adicionar ao Carrinho
          </button>
        </div>
      </div>
    `;

    this.navigateTo('screen-product-details');
  }

  addProductToCart(productId, navigateAfter = false) {
    const prod = SHOP_PRODUCTS.find(p => p.id === productId);
    if (!prod) return;

    // Procura se o produto já está no carrinho
    const existing = this.cart.find(item => item.id === productId && item.type === 'shop');
    if (existing) {
      existing.quantity++;
    } else {
      this.cart.push({
        type: 'shop',
        id: productId,
        name: prod.name,
        brand: prod.category,
        price: prod.price,
        quantity: 1,
        pharmacyId: prod.pharmacyId,
        image: prod.image
      });
    }

    this.saveCart();
    this.updateCartBadge();
    
    if (navigateAfter) {
      this.navigateTo('screen-cart');
    } else {
      alert(`${prod.name} adicionado ao carrinho com sucesso!`);
    }
  }

  // ----------------------------------------------------
  // CARRINHO E SELEÇÃO DE OPÇÕES DE ENTREGA
  // ----------------------------------------------------
  renderCart() {
    const container = document.getElementById('cart-items-container');
    container.innerHTML = '';

    if (this.cart.length === 0) {
      container.innerHTML = `
        <div class="cart-empty">
          <span class="material-symbols-outlined">remove_shopping_cart</span>
          <p>Seu carrinho está vazio.</p>
          <button class="routine-btn" onclick="app.navigateTo('screen-shop')" style="margin-top:10px; width:auto;">Ir para a Loja</button>
        </div>
      `;
      document.getElementById('cart-summary-box').style.display = 'none';
      document.getElementById('btn-cart-checkout-proceed').style.display = 'none';
      return;
    }

    document.getElementById('cart-summary-box').style.display = 'flex';
    document.getElementById('btn-cart-checkout-proceed').style.display = 'flex';

    // Agrupa itens do carrinho por Farmácia para mostrar a origem do frete
    let cartByPharmacy = {};
    this.cart.forEach((item, idx) => {
      if (!cartByPharmacy[item.pharmacyId]) {
        cartByPharmacy[item.pharmacyId] = [];
      }
      cartByPharmacy[item.pharmacyId].push({ item, idx });
    });

    Object.keys(cartByPharmacy).forEach(pharmId => {
      const pharm = PHARMACIES.find(p => p.id === pharmId);
      const itemsList = cartByPharmacy[pharmId];

      const pharmacyGroup = document.createElement('div');
      pharmacyGroup.style.marginBottom = '16px';
      
      let headerHtml = `
        <div style="font-size:12px; font-weight:800; color:var(--primary); padding-bottom:6px; display:flex; justify-content:space-between; border-bottom: 1px solid var(--surface-container-high);">
          <span>Produtos da ${pharm.name}</span>
          <span style="color:var(--secondary)">Frete: R$ ${pharm.deliveryFee.toFixed(2).replace('.', ',')}</span>
        </div>
      `;
      pharmacyGroup.innerHTML = headerHtml;

      itemsList.forEach(({ item, idx }) => {
        const itemCard = document.createElement('div');
        itemCard.className = 'cart-item-card';
        itemCard.style.marginTop = '8px';

        const catalogItem = MEDICINES_CATALOG.find(c => c.id === item.id);
        let itemSubtotal = item.price * item.quantity;
        let priceSectionHtml = '';

        // Calcula desconto progressivo (promo)
        let hasPromo = false;
        let promoTotal = null;
        let promoText = '';
        if (catalogItem && catalogItem.progressivePromo && catalogItem.progressivePromo.prices) {
          const promoPrices = catalogItem.progressivePromo.prices;
          if (promoPrices[item.quantity]) {
            promoTotal = promoPrices[item.quantity];
          } else {
            const maxPromoQty = Math.max(...Object.keys(promoPrices).map(Number));
            if (item.quantity > maxPromoQty) {
              promoTotal = promoPrices[maxPromoQty] + (item.quantity - maxPromoQty) * item.price;
            }
          }
          if (promoTotal !== null && promoTotal < itemSubtotal) {
            const savings = itemSubtotal - promoTotal;
            itemSubtotal = promoTotal;
            hasPromo = true;
            promoText = `Promoção: Leve ${item.quantity} por R$ ${promoTotal.toFixed(2).replace('.', ',')}. Economia: R$ ${savings.toFixed(2).replace('.', ',')}`;
          }
        }

        if (hasPromo) {
          priceSectionHtml = `
            <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 2px;">
              <span style="text-decoration: line-through; color: var(--on-surface-variant); font-size: 11px;">R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
              <span class="cart-item-price" style="color: var(--primary); font-weight: 800; font-size: 14px;">R$ ${itemSubtotal.toFixed(2).replace('.', ',')}</span>
              <span style="font-size: 9px; font-weight: 700; color: #32bcad; background: rgba(50, 188, 173, 0.1); padding: 2px 6px; border-radius: 4px; max-width: 140px; text-align: right;">
                ${promoText}
              </span>
            </div>
          `;
        } else if (catalogItem && catalogItem.discountAgreement && item.quantity >= catalogItem.discountAgreement.minQuantity) {
          const discountPercentage = catalogItem.discountAgreement.discountPercentage;
          const discountVal = itemSubtotal * (discountPercentage / 100);
          const discountedPrice = itemSubtotal - discountVal;
          priceSectionHtml = `
            <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 2px;">
              <span style="text-decoration: line-through; color: var(--on-surface-variant); font-size: 11px;">R$ ${itemSubtotal.toFixed(2).replace('.', ',')}</span>
              <span class="cart-item-price" style="color: var(--primary); font-weight: 800; font-size: 14px;">R$ ${discountedPrice.toFixed(2).replace('.', ',')}</span>
              <span style="font-size: 10px; font-weight: 700; color: var(--primary); background: rgba(68, 105, 0, 0.1); padding: 2px 6px; border-radius: 4px;">
                ${discountPercentage}% OFF (PBM)
              </span>
            </div>
          `;
        } else {
          priceSectionHtml = `
            <span class="cart-item-price">R$ ${itemSubtotal.toFixed(2).replace('.', ',')}</span>
          `;
        }

        const genBadge = item.isGeneric ? '<span class="generic-badge" style="font-size: 8px; font-weight: 800; padding: 1px 4px; border-radius: 3px; background-color: var(--primary-container); color: var(--on-primary-container); vertical-align: middle; margin-left: 4px;">GENÉRICO</span>' : '';

        let cartPromoAvailableHtml = '';
        if (catalogItem && catalogItem.progressivePromo && catalogItem.progressivePromo.prices) {
          const promoPrices = catalogItem.progressivePromo.prices;
          const currentPrice = item.price; // price of 1
          
          let promoOptions = [];
          Object.entries(promoPrices).forEach(([qStr, pVal]) => {
            const q = Number(qStr);
            const origTotal = currentPrice * q;
            const savings = origTotal - pVal;
            if (savings > 0) {
              const active = item.quantity === q;
              promoOptions.push({ q, pVal, savings, active });
            }
          });
          
          if (promoOptions.length > 0) {
            cartPromoAvailableHtml = `
              <div class="cart-promo-badge" style="margin-top: 6px; padding: 6px 8px; border-radius: 6px; background-color: rgba(50, 188, 173, 0.05); border: 1px dashed #32bcad; font-size: 10px; color: var(--on-surface-variant); text-align: left; width: 100%;">
                <div style="font-weight: 800; color: #32bcad; margin-bottom: 2px; display: flex; align-items: center; gap: 4px;">
                  <span class="material-symbols-outlined" style="font-size: 12px;">campaign</span>
                  <span>Promoção Progressiva Disponível:</span>
                </div>
            `;
            promoOptions.forEach(opt => {
              cartPromoAvailableHtml += `
                <div style="display: flex; justify-content: space-between; font-weight: ${opt.active ? '800' : '500'}; color: ${opt.active ? '#32bcad' : 'var(--on-surface-variant)'};">
                  <span>Leve ${opt.q} un:</span>
                  <span>R$ ${opt.pVal.toFixed(2).replace('.', ',')} ${opt.active ? '<strong>(ATIVADO)</strong>' : `(economize R$ ${opt.savings.toFixed(2).replace('.', ',')})`}</span>
                </div>
              `;
            });
            cartPromoAvailableHtml += `</div>`;
          }
        }

        itemCard.innerHTML = `
          <div class="cart-item-left">
            <div class="cart-item-image">
              <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="cart-item-details">
              <h4>${item.name} ${genBadge}</h4>
              <p>${item.brand || ''}</p>
              ${(catalogItem && catalogItem.progressivePromo && catalogItem.progressivePromo.prices) ? `<div class="promo-progressive-badge" style="margin-bottom: 4px;"><span class="material-symbols-outlined" style="font-size: 12px;">sell</span> Desconto progressivo</div>` : ''}
              <div style="display: flex; align-items: center; gap: 8px; background-color: var(--surface-container-high); border-radius: 12px; padding: 2px 8px; width: fit-content; margin-top: 4px; user-select: none;">
                <button onclick="app.updateCartItemQty(${idx}, ${item.quantity - 1})" style="background: none; border: none; font-size: 14px; font-weight: 800; color: var(--primary); cursor: pointer; padding: 0 4px;" ${item.quantity <= 1 ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>-</button>
                <span style="font-size: 12px; font-weight: 800; color: var(--on-surface); min-width: 12px; text-align: center;">${item.quantity}</span>
                <button onclick="app.updateCartItemQty(${idx}, ${item.quantity + 1})" style="background: none; border: none; font-size: 14px; font-weight: 800; color: var(--primary); cursor: pointer; padding: 0 4px;">+</button>
              </div>
              ${cartPromoAvailableHtml}
            </div>
          </div>
          <div class="cart-item-right" style="display: flex; align-items: center; gap: 8px;">
            ${priceSectionHtml}
            <button class="remove-item-btn" onclick="app.removeCartItem(${idx})" title="Remover item">
              <span class="material-symbols-outlined" style="font-size:20px;">delete</span>
            </button>
          </div>
        `;
        pharmacyGroup.appendChild(itemCard);
      });

      container.appendChild(pharmacyGroup);
    });

    // Endereço de entrega select dropdown
    const select = document.getElementById('cart-address-selector');
    select.innerHTML = '';
    this.addresses.forEach(addr => {
      const opt = document.createElement('option');
      opt.value = addr.id;
      opt.textContent = `${addr.street}, ${addr.number} (${addr.neighborhood})`;
      select.appendChild(opt);
    });

    this.renderCartSummary();
  }

  updateCartItemQty(index, newQty) {
    if (newQty < 1) return;
    this.cart[index].quantity = newQty;
    this.saveCart();
    this.updateCartBadge();
    this.renderCart();
  }

  removeCartItem(index) {
    this.cart.splice(index, 1);
    this.saveCart();
    this.updateCartBadge();
    this.renderCart();
  }

  renderCartSummary() {
    const container = document.getElementById('cart-summary-box');
    container.innerHTML = '';

    let subtotal = 0;
    let totalDiscounts = 0;
    let distinctPharmacies = new Set();

    this.cart.forEach(item => {
      const normalSubtotal = item.price * item.quantity;
      distinctPharmacies.add(item.pharmacyId);

      const catalogItem = MEDICINES_CATALOG.find(c => c.id === item.id);
      
      let itemSubtotal = normalSubtotal;
      let hasPromo = false;
      let promoTotal = null;
      if (catalogItem && catalogItem.progressivePromo && catalogItem.progressivePromo.prices) {
        const promoPrices = catalogItem.progressivePromo.prices;
        if (promoPrices[item.quantity]) {
          promoTotal = promoPrices[item.quantity];
        } else {
          const maxPromoQty = Math.max(...Object.keys(promoPrices).map(Number));
          if (item.quantity > maxPromoQty) {
            promoTotal = promoPrices[maxPromoQty] + (item.quantity - maxPromoQty) * item.price;
          }
        }
        if (promoTotal !== null && promoTotal < normalSubtotal) {
          itemSubtotal = promoTotal;
          hasPromo = true;
          totalDiscounts += (normalSubtotal - promoTotal);
        }
      }

      subtotal += normalSubtotal;

      if (!hasPromo && catalogItem && catalogItem.discountAgreement && item.quantity >= catalogItem.discountAgreement.minQuantity) {
        const discountPercentage = catalogItem.discountAgreement.discountPercentage;
        totalDiscounts += normalSubtotal * (discountPercentage / 100);
      }
    });

    let totalDeliveryFee = 0;
    distinctPharmacies.forEach(pharmId => {
      const pharm = PHARMACIES.find(p => p.id === pharmId);
      if (pharm) totalDeliveryFee += pharm.deliveryFee;
    });

    const total = subtotal - totalDiscounts + totalDeliveryFee;

    let discountHtml = '';
    if (totalDiscounts > 0) {
      discountHtml = `
        <div class="summary-row" style="color: var(--primary);">
          <span>Descontos / Promoções</span>
          <span>- R$ ${totalDiscounts.toFixed(2).replace('.', ',')}</span>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="summary-row">
        <span>Subtotal dos Itens</span>
        <span>R$ ${subtotal.toFixed(2).replace('.', ',')}</span>
      </div>
      ${discountHtml}
      <div class="summary-row">
        <span>Taxas de Entrega (${distinctPharmacies.size} farmácia(s))</span>
        <span>R$ ${totalDeliveryFee.toFixed(2).replace('.', ',')}</span>
      </div>
      <div class="summary-row total" style="font-size: 18px; font-weight: 900; color: var(--primary); border-top: 2px dashed var(--primary); padding-top: 12px; margin-top: 10px;">
        <span>Total Final</span>
        <span>R$ ${total.toFixed(2).replace('.', ',')}</span>
      </div>
    `;
  }

  updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;
    
    const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (totalItems > 0) {
      badge.textContent = totalItems;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }

  // ----------------------------------------------------
  // LOGICA DE CHECKOUT E PROCESSAMENTO
  // ----------------------------------------------------
  renderCheckout() {
    // Alerta de medicamento controlado
    const hasControlled = this.cart.some(item => {
      const catItem = MEDICINES_CATALOG.find(c => c.id === item.id);
      return catItem && catItem.requiresPrescription;
    });
    
    const alertBox = document.getElementById('checkout-prescription-alert');
    if (hasControlled) {
      alertBox.style.display = 'flex';
    } else {
      alertBox.style.display = 'none';
    }

    // Itens no resumo
    const list = document.getElementById('checkout-items-summary');
    list.innerHTML = '';

    let subtotal = 0;
    let totalDiscounts = 0;
    let distinctPharmacies = new Set();

    this.cart.forEach(item => {
      const itemSubtotal = item.price * item.quantity;
      subtotal += itemSubtotal;
      distinctPharmacies.add(item.pharmacyId);

      const catalogItem = MEDICINES_CATALOG.find(c => c.id === item.id);
      let discApplied = false;
      let finalItemPrice = itemSubtotal;
      if (catalogItem && catalogItem.discountAgreement && item.quantity >= catalogItem.discountAgreement.minQuantity) {
        const discountPercentage = catalogItem.discountAgreement.discountPercentage;
        const discountVal = itemSubtotal * (discountPercentage / 100);
        totalDiscounts += discountVal;
        finalItemPrice -= discountVal;
        discApplied = true;
      }

      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.alignItems = 'flex-start';
      row.innerHTML = `
        <div>
          <span>${item.quantity}x ${item.name}</span>
          ${discApplied ? `<br><span style="color:var(--primary); font-size:10px; font-weight:700;">(Desc. Convênio Aplicado)</span>` : ''}
        </div>
        <span>R$ ${finalItemPrice.toFixed(2).replace('.', ',')}</span>
      `;
      list.appendChild(row);
    });

    let totalDeliveryFee = 0;
    distinctPharmacies.forEach(pharmId => {
      const pharm = PHARMACIES.find(p => p.id === pharmId);
      if (pharm) totalDeliveryFee += pharm.deliveryFee;
    });

    const total = subtotal - totalDiscounts + totalDeliveryFee;

    let discountHtml = '';
    if (totalDiscounts > 0) {
      discountHtml = `
        <div style="display: flex; justify-content: space-between; color: var(--primary); margin-bottom: 4px;">
          <span>Descontos (PBM)</span>
          <span>- R$ ${totalDiscounts.toFixed(2).replace('.', ',')}</span>
        </div>
      `;
    }

    const priceBadge = document.getElementById('checkout-total-price-badge');
    if (priceBadge) {
      priceBadge.style.display = 'flex';
      priceBadge.style.flexDirection = 'column';
      priceBadge.style.gap = '4px';
      priceBadge.style.fontWeight = '600';
      priceBadge.style.fontSize = '12px';
      priceBadge.style.color = 'var(--on-surface-variant)';
      priceBadge.style.borderTop = '1px solid var(--surface-container)';
      priceBadge.style.marginTop = '10px';
      priceBadge.style.paddingTop = '8px';
      
      priceBadge.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>Subtotal dos Itens</span>
          <span>R$ ${subtotal.toFixed(2).replace('.', ',')}</span>
        </div>
        ${discountHtml}
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span>Taxas de Entrega</span>
          <span>R$ ${totalDeliveryFee.toFixed(2).replace('.', ',')}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 18px; color: var(--primary); border-top: 2px dashed var(--primary); padding-top: 10px; margin-top: 6px;">
          <span>Total Final</span>
          <span id="checkout-total-val">R$ ${total.toFixed(2).replace('.', ',')}</span>
        </div>
      `;
    }
  }

  completeOrder() {
    const overlay = document.getElementById('global-loading-overlay');
    const overlayText = document.getElementById('global-loading-text');

    overlay.classList.add('active');
    overlayText.textContent = "Processando pagamento seguro...";

    // Calcular detalhes para o histórico de compras antes de limpar o carrinho
    let subtotal = 0;
    let totalDiscounts = 0;
    let distinctPharmacies = new Set();
    let medicines = [];

    this.cart.forEach(item => {
      const normalSubtotal = item.price * item.quantity;
      distinctPharmacies.add(item.pharmacyId);

      const catalogItem = MEDICINES_CATALOG.find(c => c.id === item.id);
      
      let itemSubtotal = normalSubtotal;
      let hasPromo = false;
      let promoTotal = null;
      if (catalogItem && catalogItem.progressivePromo && catalogItem.progressivePromo.prices) {
        const promoPrices = catalogItem.progressivePromo.prices;
        if (promoPrices[item.quantity]) {
          promoTotal = promoPrices[item.quantity];
        } else {
          const maxPromoQty = Math.max(...Object.keys(promoPrices).map(Number));
          if (item.quantity > maxPromoQty) {
            promoTotal = promoPrices[maxPromoQty] + (item.quantity - maxPromoQty) * item.price;
          }
        }
        if (promoTotal !== null && promoTotal < normalSubtotal) {
          itemSubtotal = promoTotal;
          hasPromo = true;
          totalDiscounts += (normalSubtotal - promoTotal);
        }
      }

      if (!hasPromo && catalogItem && catalogItem.discountAgreement && item.quantity >= catalogItem.discountAgreement.minQuantity) {
        const discountPercentage = catalogItem.discountAgreement.discountPercentage;
        totalDiscounts += normalSubtotal * (discountPercentage / 100);
      }

      medicines.push({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        brand: item.brand || ''
      });
    });

    let totalDeliveryFee = 0;
    distinctPharmacies.forEach(pharmId => {
      const pharm = PHARMACIES.find(p => p.id === pharmId);
      if (pharm) totalDeliveryFee += pharm.deliveryFee;
    });

    const total = subtotal - totalDiscounts + totalDeliveryFee;

    // Calcular Economia Simétrica / Histórica
    let savings = 0;
    this.cart.forEach(item => {
      const catalogItem = MEDICINES_CATALOG.find(c => c.id === item.id);
      if (catalogItem) {
        const maxPrice = Math.max(...Object.values(catalogItem.prices));
        const normalSubtotal = item.price * item.quantity;
        let itemSubtotal = normalSubtotal;
        
        let hasPromo = false;
        let promoTotal = null;
        if (catalogItem.progressivePromo && catalogItem.progressivePromo.prices) {
          const promoPrices = catalogItem.progressivePromo.prices;
          if (promoPrices[item.quantity]) {
            promoTotal = promoPrices[item.quantity];
          } else {
            const maxPromoQty = Math.max(...Object.keys(promoPrices).map(Number));
            if (item.quantity > maxPromoQty) {
              promoTotal = promoPrices[maxPromoQty] + (item.quantity - maxPromoQty) * item.price;
            }
          }
          if (promoTotal !== null && promoTotal < normalSubtotal) {
            itemSubtotal = promoTotal;
            hasPromo = true;
          }
        }
        if (!hasPromo && catalogItem.discountAgreement && item.quantity >= catalogItem.discountAgreement.minQuantity) {
          const discountPercentage = catalogItem.discountAgreement.discountPercentage;
          itemSubtotal -= normalSubtotal * (discountPercentage / 100);
        }
        
        savings += (maxPrice * item.quantity) - itemSubtotal;
      }
    });

    // Pega forma de pagamento selecionada
    const paymentVal = document.querySelector('input[name="payment-method"]:checked')?.value || 'pix';
    let paymentMethod = 'Pix';
    if (paymentVal === 'credit') paymentMethod = 'Cartão de Crédito';
    else if (paymentVal === 'debit') paymentMethod = 'Cartão de Débito';

    // Determina nome da farmácia
    let pharmacyName = 'Múltiplas Farmácias';
    if (distinctPharmacies.size === 1) {
      const pharmId = [...distinctPharmacies][0];
      pharmacyName = PHARMACIES.find(p => p.id === pharmId)?.name || 'Farmácia';
    }

    const newOrder = {
      id: 'ord_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      pharmacy: pharmacyName,
      medicines: medicines,
      subtotal: subtotal,
      deliveryFee: totalDeliveryFee,
      discount: totalDiscounts,
      total: total,
      savings: savings,
      paymentMethod: paymentMethod,
      status: 'Entregue'
    };

    setTimeout(() => {
      overlayText.textContent = "Registrando pedido nas farmácias...";
      
      setTimeout(() => {
        overlay.classList.remove('active');
        
        // Adiciona ao início do histórico e salva
        this.purchaseHistory.unshift(newOrder);
        this.savePurchaseHistory();

        // Limpa o carrinho
        this.cart = [];
        this.saveCart();
        this.updateCartBadge();

        // Abre modal de sucesso
        this.openModal('modal-order-success');
      }, 1500);
    }, 1500);
  }

  // ----------------------------------------------------
  // LOGICA E RENDERIZAÇÃO DO COFRE DE RECEITAS
  // ----------------------------------------------------
  renderVault() {
    const container = document.getElementById('vault-items-container');
    container.innerHTML = '';

    if (this.vault.length === 0) {
      container.innerHTML = `
        <div class="vault-empty">
          <span class="material-symbols-outlined">folder_open</span>
          <p>Seu cofre de receitas está vazio.</p>
          <p style="font-size:11px; margin-top:4px;">Suas receitas digitalizadas aparecem aqui para cotações futuras.</p>
        </div>
      `;
      return;
    }

    const list = document.createElement('div');
    list.className = 'vault-list';

    this.vault.forEach(item => {
      const card = document.createElement('div');
      card.className = 'vault-item-card';
      
      let medsListHtml = item.medicines.map(m => `<span style="display:block;">• ${m}</span>`).join('');

      card.innerHTML = `
        <div class="vault-item-left" style="align-items: flex-start;">
          <div class="vault-item-icon">
            <img src="prescription_symbol.png" alt="Receita" style="width: 38px; height: 38px; object-fit: contain;">
          </div>
          <div class="vault-item-info">
            <div style="margin-bottom: 6px;">
              <h4 style="font-size: 14px; font-weight: 800; color: var(--primary); margin: 0;">${item.doctorName || "Dr. João Silva"}</h4>
              <p style="font-size: 11px; color: #28664A; font-weight: 700; text-transform: uppercase; margin: 2px 0 0 0; letter-spacing: 0.5px;">${item.doctorSpecialty || "Cardiologista"}</p>
            </div>
            <h5 style="font-size: 12px; font-weight: 700; color: var(--on-surface); margin: 0;">${item.title}</h5>
            <p style="font-size: 11px; color: var(--on-surface-variant); margin: 2px 0 4px 0;">${item.date}</p>
            <div style="font-size: 11px; color: var(--on-surface); line-height: 1.4; font-weight: 500;">
              ${medsListHtml}
            </div>
          </div>
        </div>
        <button class="vault-item-action-btn" onclick="app.loadPresetPrescription('${item.presetKey}')">Recotar</button>
      `;
      list.appendChild(card);
    });

    container.appendChild(list);
  }

  // Ações rápidas de repetição de compra
  repeatPurchase(medicineId) {
    const catalogItem = MEDICINES_CATALOG.find(c => c.id === medicineId);
    if (!catalogItem) return;

    // Pega o menor preço e a respectiva farmácia
    let bestPharmId = null;
    let bestPrice = Infinity;
    PHARMACIES.forEach(pharm => {
      const price = catalogItem.prices[pharm.id];
      if (price && price < bestPrice) {
        bestPrice = price;
        bestPharmId = pharm.id;
      }
    });

    const qty = (this.recentPurchaseQuantities && this.recentPurchaseQuantities[medicineId]) || 1;

    this.cart.push({
      type: 'quote',
      id: medicineId,
      name: catalogItem.name,
      brand: catalogItem.brand,
      price: bestPrice,
      quantity: qty,
      pharmacyId: bestPharmId,
      image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=100'
    });

    this.saveCart();
    this.updateCartBadge();
    alert(`Compra repetida: ${catalogItem.name} (${qty}x) adicionado ao carrinho!`);
    this.navigateTo('screen-cart');
  }

  updateRecentPurchaseQty(medId, delta) {
    if (!this.recentPurchaseQuantities) {
      this.recentPurchaseQuantities = {
        dipirona: 1,
        omega3: 1
      };
    }
    let current = this.recentPurchaseQuantities[medId] || 1;
    current += delta;
    if (current < 1) current = 1;
    this.recentPurchaseQuantities[medId] = current;
    
    const el = document.getElementById(`qty-recent-${medId}`);
    if (el) el.textContent = current;
  }

  // ----------------------------------------------------
  // MÓDULO DE CRONOGRAMA E NOTIFICAÇÕES
  // ----------------------------------------------------
  setupScheduleCalendar() {
    const datesContainer = document.getElementById('schedule-week-calendar');
    if (!datesContainer) return;
    
    datesContainer.innerHTML = '';
    const today = new Date();
    
    // Mostra últimos 3 dias, hoje, e próximos 3 dias
    for (let i = -3; i <= 3; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      
      const dayName = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
      const dayNum = d.getDate();
      const isToday = i === 0;
      
      const dateEl = document.createElement('div');
      dateEl.className = `sched-date-item ${isToday ? 'active' : ''}`;
      dateEl.innerHTML = `
        <div class="sched-date-day">${dayName}</div>
        <div class="sched-date-num">${dayNum}</div>
      `;
      
      dateEl.addEventListener('click', () => {
        document.querySelectorAll('.sched-date-item').forEach(el => el.classList.remove('active'));
        dateEl.classList.add('active');
        this.selectedScheduleDate = d;
        this.renderScheduleDosesForDate(d);
      });
      
      datesContainer.appendChild(dateEl);
    }
    
    this.selectedScheduleDate = today;
  }

  renderSchedule() {
    this.setupScheduleCalendar();
    this.renderScheduleDosesForDate(new Date());
    this.renderScheduleHistory();
  }

  renderScheduleDosesForDate(dateObj) {
    const container = document.getElementById('schedule-doses-list');
    if (!container) return;
    container.innerHTML = '';
    
    const dayOfWeek = dateObj.getDay(); // 0-6
    const dateStr = dateObj.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];
    const isPast = dateStr < todayStr;
    const isFuture = dateStr > todayStr;
    
    let activeDoses = [];
    
    this.schedule.forEach(entry => {
      // Verifica frequência
      let shouldShow = false;
      if (entry.frequency === 'daily') shouldShow = true;
      else if (entry.frequency === 'custom' && entry.customDays.includes(dayOfWeek)) shouldShow = true;
      
      if (shouldShow) {
        entry.times.forEach(time => {
          activeDoses.push({ entry, time });
        });
      }
    });
    
    // Sort by time
    activeDoses.sort((a, b) => a.time.localeCompare(b.time));
    
    if (activeDoses.length === 0) {
      container.innerHTML = '<div style="text-align:center; padding: 20px; color: var(--on-surface-variant); font-size: 13px;">Nenhuma dose programada para este dia.</div>';
      return;
    }
    
    activeDoses.forEach(({ entry, time }) => {
      const takenKey = `${entry.id}_${dateStr}_${time}`;
      const isTaken = this.doseTaken[takenKey];
      
      let actionHtml = '';
      let cardClass = 'sched-dose-card';
      let color = entry.color || 'var(--primary)';
      
      if (isPast) {
        if (isTaken) {
          actionHtml = `
            <span style="color:var(--primary); font-size:12px; font-weight:700; display:flex; align-items:center; gap:4px;">
              <span class="material-symbols-outlined" style="font-size:16px; font-variation-settings: 'FILL' 1;">check_circle</span>
              Tomado
            </span>
          `;
          cardClass += ' taken';
        } else {
          actionHtml = `
            <span style="color:var(--error); font-size:12px; font-weight:700; display:flex; align-items:center; gap:4px;">
              <span class="material-symbols-outlined" style="font-size:16px; font-variation-settings: 'FILL' 1;">cancel</span>
              Não Tomado
            </span>
          `;
          cardClass += ' missed';
          color = 'var(--error)';
        }
      } else if (isFuture) {
        actionHtml = `
          <span style="color:var(--on-surface-variant); font-size:12px; font-weight:600; opacity:0.6;">
            Agendado
          </span>
        `;
      } else {
        // Today
        if (isTaken) {
          actionHtml = `
            <button class="form-btn" onclick="event.stopPropagation(); app.markDoseTaken('${entry.id}', '${dateStr}', '${time}', false)" style="display: flex; align-items: center; gap: 4px; background: var(--primary); color: white; border: none; padding: 6px 12px; border-radius: var(--radius-full); font-size: 11px; font-weight: 800; cursor: pointer; width: auto; height: auto; margin: 0; box-shadow: none;">
              <span class="material-symbols-outlined" style="font-size: 14px; font-variation-settings: 'FILL' 1;">check_circle</span>
              Tomado
            </button>
          `;
          cardClass += ' taken';
        } else {
          actionHtml = `
            <button class="form-btn" onclick="event.stopPropagation(); app.markDoseTaken('${entry.id}', '${dateStr}', '${time}', true)" style="display: flex; align-items: center; gap: 4px; background: transparent; color: var(--primary); border: 1px solid var(--primary); padding: 6px 12px; border-radius: var(--radius-full); font-size: 11px; font-weight: 800; cursor: pointer; width: auto; height: auto; margin: 0; box-shadow: none;">
              <span class="material-symbols-outlined" style="font-size: 14px;">circle</span>
              Tomado
            </button>
          `;
        }
      }
      
      const card = document.createElement('div');
      card.className = cardClass;
      card.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-radius: var(--radius-default); border: 1px solid var(--surface-container); margin-bottom: 10px; background: var(--surface-container-lowest); cursor: pointer;';
      card.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
          <div class="sched-dose-time" style="background-color: ${color}20; color: ${color}; padding: 6px 10px; border-radius: 8px; font-weight: 800; font-size: 13px; min-width: 54px; text-align: center;">${time}</div>
          <div class="sched-dose-info" style="display: flex; flex-direction: column; gap: 2px; text-align: left;">
            <div class="sched-dose-name" style="font-size: 14px; font-weight: 700; color: var(--on-surface);">${entry.medicineName}</div>
            <div class="sched-dose-detail" style="font-size: 11px; color: var(--on-surface-variant); font-weight: 500;">${entry.dosage}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          ${actionHtml}
          <button onclick="event.stopPropagation(); app.openScheduleActionsModalById('${entry.id}', '${dateStr}', '${time}')" style="background: none; border: none; color: var(--on-surface-variant); cursor: pointer; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%;">
            <span class="material-symbols-outlined" style="font-size: 20px;">more_vert</span>
          </button>
        </div>
      `;
      
      card.addEventListener('click', () => {
        if (!isPast && !isFuture) {
          this.markDoseTaken(entry.id, dateStr, time, !isTaken);
        }
      });
      
      container.appendChild(card);
    });
  }

  markDoseTaken(entryId, dateStr, time, taken) {
    const key = `${entryId}_${dateStr}_${time}`;
    this.doseTaken[key] = taken;
    this.saveDoseTaken();

    if (taken) {
      const entry = this.schedule.find(s => s.id === entryId);
      if (entry) {
        const now = new Date();
        const confirmTimeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
        
        const logEntry = {
          date: dateStr,
          scheduledTime: time,
          confirmTime: confirmTimeStr,
          medicineName: entry.medicineName,
          dosage: entry.dosage
        };
        
        const exists = this.adherenceLog.some(l => l.date === dateStr && l.scheduledTime === time && l.medicineName === entry.medicineName);
        if (!exists) {
          this.adherenceLog.unshift(logEntry);
          localStorage.setItem('mediqia_adherence_log', JSON.stringify(this.adherenceLog));
        }
      }
    } else {
      const entry = this.schedule.find(s => s.id === entryId);
      if (entry) {
        this.adherenceLog = this.adherenceLog.filter(l => !(l.date === dateStr && l.scheduledTime === time && l.medicineName === entry.medicineName));
        localStorage.setItem('mediqia_adherence_log', JSON.stringify(this.adherenceLog));
      }
    }

    this.renderScheduleDosesForDate(this.selectedScheduleDate || new Date());
    this.renderScheduleHistory();
    this.updateScheduleBadge();
    this.updateHomeRoutineCard();
  }
  
  removeScheduleEntry(entryId) {
    if (confirm("Deseja remover este medicamento do cronograma?")) {
      this.schedule = this.schedule.filter(s => s.id !== entryId);
      this.saveSchedule();
      this.renderSchedule();
      this.updateScheduleBadge();
      this.updateHomeRoutineCard();
    }
  }

  openScheduleActionsModal(entry, dateStr, time) {
    this.selectedScheduleEntry = entry;
    this.selectedScheduleDoseTime = time;
    this.selectedScheduleDateStr = dateStr;
    
    const titleEl = document.getElementById('modal-schedule-actions-title');
    if (titleEl) {
      titleEl.innerText = entry.medicineName;
    }
    
    this.openModal('modal-schedule-actions');
  }

  openScheduleActionsModalById(entryId, dateStr, time) {
    const entry = this.schedule.find(s => s.id === entryId);
    if (entry) {
      this.openScheduleActionsModal(entry, dateStr, time);
    }
  }

  startDoseScheduler() {
    if (this._doseSchedulerInterval) clearInterval(this._doseSchedulerInterval);
    this._doseSchedulerInterval = setInterval(() => {
      const now = new Date();
      const currentHourMin = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
      const dateStr = now.toISOString().split('T')[0];
      const dayOfWeek = now.getDay();
      
      this.schedule.forEach(entry => {
        let shouldNotify = false;
        if (entry.frequency === 'daily') shouldNotify = true;
        else if (entry.frequency === 'custom' && entry.customDays.includes(dayOfWeek)) shouldNotify = true;
        
        if (shouldNotify) {
          entry.times.forEach(time => {
            if (time === currentHourMin) {
              const notifyKey = `${entry.id}_${dateStr}_${time}`;
              if (this.lastNotifiedDose !== notifyKey && !this.doseTaken[notifyKey]) {
                this.lastNotifiedDose = notifyKey;
                this.triggerDoseReminder(entry, time, dateStr);
              }
            }
          });
        }
      });
    }, 10000);
  }

  playBeep() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.value = 880;
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.error("Audio Context error:", e);
    }
  }

  triggerDoseReminder(entry, time, dateStr) {
    this.playBeep();
    
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Lembrete de Medicamento", {
        body: `Está na hora de tomar ${entry.medicineName} (${entry.dosage}) - ${time}`,
        icon: "logo.png"
      });
    }
    
    this.reminderActiveDose = { entry, time, dateStr };
    const nameEl = document.getElementById('reminder-med-name');
    const detailsEl = document.getElementById('reminder-med-details');
    if (nameEl) nameEl.textContent = entry.medicineName;
    if (detailsEl) detailsEl.textContent = `${time} • ${entry.dosage}`;
    
    this.openModal('modal-dose-reminder');
  }

  openEditScheduleModal(entry) {
    this.editingScheduleId = entry.id;
    
    document.getElementById('sched-med-name').value = entry.medicineName;
    document.getElementById('sched-dosage').value = entry.dosage;
    document.getElementById('sched-frequency').value = entry.frequency;
    
    const daysSelector = document.getElementById('sched-days-selector');
    daysSelector.style.display = entry.frequency === 'custom' ? 'block' : 'none';
    
    document.querySelectorAll('#sched-days-selector input[type="checkbox"]').forEach(cb => {
      cb.checked = entry.customDays.includes(Number(cb.value));
    });
    
    const container = document.getElementById('sched-times-container');
    container.innerHTML = '';
    entry.times.forEach(time => {
      const row = document.createElement('div');
      row.style.cssText = 'display: flex; gap: 8px;';
      row.innerHTML = `<input class="form-input sched-time-input" type="time" value="${time}" style="flex: 1;">
        <button class="remove-item-btn" onclick="this.parentElement.remove()" style="flex-shrink:0;">
          <span class="material-symbols-outlined">close</span>
        </button>`;
      container.appendChild(row);
    });
    
    if (entry.times.length === 0) {
      const row = document.createElement('div');
      row.style.cssText = 'display: flex; gap: 8px;';
      row.innerHTML = `<input class="form-input sched-time-input" type="time" value="08:00" style="flex: 1;">
        <button class="remove-item-btn" onclick="this.parentElement.remove()" style="flex-shrink:0;">
          <span class="material-symbols-outlined">close</span>
        </button>`;
      container.appendChild(row);
    }
    
    this.selectedScheduleColor = entry.color || '#446900';
    document.querySelectorAll('.color-swatch').forEach(sw => {
      if (sw.getAttribute('data-color') === this.selectedScheduleColor) {
        sw.classList.add('active');
      } else {
        sw.classList.remove('active');
      }
    });
    
    this.openModal('modal-add-schedule');
  }

  renderScheduleHistory() {
    const container = document.getElementById('schedule-history-container');
    if (!container) return;
    container.innerHTML = '';
    
    // Pega os últimos 7 dias (excluindo hoje)
    const today = new Date();
    today.setHours(0,0,0,0);
    
    let stats = { taken: 0, missed: 0, total: 0 };
    
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      this.schedule.forEach(entry => {
        const dayOfWeek = d.getDay();
        let shouldShow = false;
        if (entry.frequency === 'daily') shouldShow = true;
        else if (entry.frequency === 'custom' && entry.customDays.includes(dayOfWeek)) shouldShow = true;
        
        if (shouldShow) {
          entry.times.forEach(time => {
            stats.total++;
            const key = `${entry.id}_${dateStr}_${time}`;
            if (this.doseTaken[key]) {
              stats.taken++;
            } else {
              stats.missed++;
            }
          });
        }
      });
    }
    
    if (stats.total === 0 && this.adherenceLog.length === 0) {
      container.innerHTML = '<div style="font-size:12px; color:var(--on-surface-variant);">Sem histórico recente.</div>';
      return;
    }
    
    const adherence = stats.total > 0 ? Math.round((stats.taken / stats.total) * 100) : 100;
    
    let statsHtml = `
      <div style="display:flex; justify-content:space-between; margin-bottom: 8px;">
        <span style="font-size:13px; font-weight:600; color:var(--on-surface);">Adesão (7 dias)</span>
        <span style="font-size:13px; font-weight:800; color:${adherence >= 80 ? 'var(--primary)' : 'var(--error)'};">${adherence}%</span>
      </div>
      <div style="width:100%; background-color:var(--surface-container-high); border-radius:4px; height:8px; overflow:hidden;">
        <div style="width:${adherence}%; background-color:${adherence >= 80 ? 'var(--primary)' : 'var(--error)'}; height:100%;"></div>
      </div>
      <div style="display:flex; justify-content:space-between; margin-top: 8px; font-size:11px; color:var(--on-surface-variant); margin-bottom: 16px;">
        <span>${stats.taken} tomadas</span>
        <span>${stats.missed} esquecidas</span>
      </div>
    `;

    let logHtml = '';
    if (this.adherenceLog && this.adherenceLog.length > 0) {
      logHtml = `
        <div style="border-top: 1px solid var(--surface-container-high); padding-top: 12px;">
          <div style="font-size: 12px; font-weight: 700; color: var(--on-surface); margin-bottom: 8px;">Histórico de Confirmações</div>
          <div style="display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto;">
      `;
      this.adherenceLog.forEach(log => {
        const dateParts = log.date.split('-');
        const dateFormatted = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}` : log.date;
        logHtml += `
          <div style="display: flex; justify-content: space-between; align-items: center; background: var(--surface-container-lowest); padding: 8px 10px; border-radius: 6px; border: 1px solid var(--surface-container);">
            <div style="text-align: left;">
              <div style="font-size: 12px; font-weight: 700; color: var(--on-surface);">${log.medicineName}</div>
              <div style="font-size: 10px; color: var(--on-surface-variant);">${log.dosage}</div>
            </div>
            <div style="text-align: right; font-size: 11px;">
              <div style="color: var(--on-surface-variant); font-weight: 500;">${dateFormatted} às ${log.scheduledTime}</div>
              <div style="color: var(--primary); font-weight: 700; font-size: 10px;">Confirmado às ${log.confirmTime}</div>
            </div>
          </div>
        `;
      });
      logHtml += `
          </div>
        </div>
      `;
    } else {
      logHtml = `
        <div style="border-top: 1px solid var(--surface-container-high); padding-top: 12px; text-align: center; font-size: 11px; color: var(--on-surface-variant);">
          Nenhuma dose confirmada registrada no histórico.
        </div>
      `;
    }

    container.innerHTML = statsHtml + logHtml;
  }

  updateScheduleBadge() {
    const badge = document.getElementById('schedule-nav-badge');
    if (!badge) return;
    
    // Calcula quantas doses faltam hoje
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const dayOfWeek = today.getDay();
    
    let pending = 0;
    
    this.schedule.forEach(entry => {
      let shouldShow = false;
      if (entry.frequency === 'daily') shouldShow = true;
      else if (entry.frequency === 'custom' && entry.customDays.includes(dayOfWeek)) shouldShow = true;
      
      if (shouldShow) {
        entry.times.forEach(time => {
          const key = `${entry.id}_${dateStr}_${time}`;
          if (!this.doseTaken[key]) {
            pending++;
          }
        });
      }
    });
    
    if (pending > 0) {
      badge.textContent = pending;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }

  updateHomeRoutineCard() {
    const circleEl = document.getElementById('home-routine-circle');
    const statusEl = document.getElementById('home-routine-status');
    const barEl    = document.getElementById('home-routine-bar');
    if (!circleEl || !statusEl || !barEl) return;

    const today = new Date().toISOString().split('T')[0];
    const dayOfWeek = new Date().getDay();

    let totalDoses = 0;
    let takenDoses = 0;

    this.schedule.forEach(entry => {
      let shouldCount = false;
      if (entry.frequency === 'daily') shouldCount = true;
      else if (entry.frequency === 'custom' && entry.customDays && entry.customDays.includes(dayOfWeek)) shouldCount = true;

      if (shouldCount) {
        entry.times.forEach(time => {
          totalDoses++;
          const key = `${entry.id}_${today}_${time}`;
          if (this.doseTaken[key]) takenDoses++;
        });
      }
    });

    const pct = totalDoses === 0 ? 0 : Math.round((takenDoses / totalDoses) * 100);
    circleEl.textContent = `${pct}%`;
    barEl.style.width = `${pct}%`;

    if (totalDoses === 0) {
      statusEl.textContent = 'Nenhum medicamento hoje';
    } else if (takenDoses === totalDoses) {
      statusEl.textContent = `✅ Todas as ${totalDoses} doses tomadas!`;
    } else {
      statusEl.textContent = `${takenDoses} de ${totalDoses} dose${totalDoses > 1 ? 's' : ''} tomada${takenDoses !== 1 ? 's' : ''}`;
    }
  }

  requestNotificationPermission() {
    if (!("Notification" in window)) {
      console.log("Este browser não suporta notificações de Desktop.");
      return;
    }
    
    if (Notification.permission === "granted") {
      this.setupNotifications();
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          this.setupNotifications();
        }
      });
    }
  }
  
  setupNotifications() {
    // Na prática isso seria um Web Worker / Service Worker
    // Aqui fazemos um timeout para a próxima dose apenas para demonstração da feature
    const today = new Date();
    const nowTime = today.getHours().toString().padStart(2, '0') + ':' + today.getMinutes().toString().padStart(2, '0');
    
    // Procura a próxima dose de hoje
    let nextDose = null;
    
    this.schedule.forEach(entry => {
      const dayOfWeek = today.getDay();
      let shouldShow = false;
      if (entry.frequency === 'daily') shouldShow = true;
      else if (entry.frequency === 'custom' && entry.customDays.includes(dayOfWeek)) shouldShow = true;
      
      if (shouldShow) {
        entry.times.forEach(time => {
          if (time > nowTime) {
            if (!nextDose || time < nextDose.time) {
              nextDose = { entry, time };
            }
          }
        });
      }
    });
    
    if (nextDose && !this._notificationScheduled) {
      this._notificationScheduled = true;
      // Para demonstração, simula um aviso em 5 segundos informando qual seria a proxima
      setTimeout(() => {
        new Notification("Mediqia - Lembrete de Medicamento", {
          body: `Sua próxima dose de ${nextDose.entry.medicineName} é às ${nextDose.time}.`,
          icon: "https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/medication/default/24px.svg"
        });
        this._notificationScheduled = false;
      }, 5000);
    }
  }

  selectScheduleColor(btnElement) {
    document.querySelectorAll('.color-swatch').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
    this.selectedScheduleColor = btnElement.getAttribute('data-color');
  }

  // Modais helpers
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
    
    const navbar = document.getElementById('app-main-navbar');
    if (navbar) navbar.classList.add('nav-hidden');
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
    
    const navbar = document.getElementById('app-main-navbar');
    if (navbar) navbar.classList.remove('nav-hidden');
  }

  renderEmergencyScreen() {
    const user = this.currentUser || {
      name: "Visitante",
      cpf: "-",
      birthdate: "",
      sex: "",
      bloodType: "-",
      insuranceName: "-",
      insuranceNumber: "-",
      insuranceCode: "-",
      conditions: [],
      otherConditions: "-",
      allergies: [],
      medicalNotes: "-"
    };

    // Personal Info
    const nameEl = document.getElementById('emergency-name');
    if (nameEl) nameEl.textContent = user.name || "Visitante";
    
    let birthText = "-";
    if (user.birthdate) {
      const age = this.calculateAge(user.birthdate);
      const parts = user.birthdate.split('-');
      const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : user.birthdate;
      birthText = `${formattedDate} (${age} anos)`;
    }
    const birthdateEl = document.getElementById('emergency-birthdate');
    if (birthdateEl) birthdateEl.textContent = birthText;

    const bloodTypeEl = document.getElementById('emergency-blood-type');
    if (bloodTypeEl) bloodTypeEl.textContent = user.bloodType || "-";

    // Allergies List
    const algList = document.getElementById('emergency-allergies-list');
    if (algList) {
      algList.innerHTML = '';
      if (user.allergies && user.allergies.length > 0) {
        user.allergies.forEach(alg => {
          const chip = document.createElement('div');
          chip.className = 'px-3 py-1 bg-red-100 text-red-800 rounded-full font-label-md text-label-md shadow-sm font-semibold';
          chip.textContent = alg;
          algList.appendChild(chip);
        });
      } else {
        algList.innerHTML = '<span class="text-[12px] text-primary/60 font-semibold">Nenhuma</span>';
      }
    }

    // Health Conditions Card - Only active ones!
    const condList = document.getElementById('emergency-conditions-list');
    if (condList) {
      condList.innerHTML = '';
      const activeConditions = user.conditions || [];
      if (activeConditions.length > 0) {
        activeConditions.forEach(cond => {
          const li = document.createElement('div');
          li.className = 'flex items-center gap-3 text-[15px] font-semibold text-primary';
          li.innerHTML = `
            <div class="w-2.5 h-2.5 rounded-full bg-brand-alert" style="background-color: var(--coral-alert) !important;"></div>
            <span>${cond}</span>
          `;
          condList.appendChild(li);
        });
      } else {
        condList.innerHTML = '<span class="text-[14px] text-primary/60 font-semibold ml-2">Nenhuma condição ativa cadastrada</span>';
      }
    }

    const otherCondEl = document.getElementById('emergency-other-conditions');
    if (otherCondEl) otherCondEl.textContent = user.otherConditions || "Nenhuma";

    // Medications Card - Dynamic medications from this.schedule
    const medList = document.getElementById('emergency-medications-list');
    if (medList) {
      medList.innerHTML = '';
      if (this.schedule && this.schedule.length > 0) {
        this.schedule.forEach(entry => {
          const li = document.createElement('li');
          li.className = 'flex items-center gap-3';
          li.innerHTML = `
            <div class="w-2 h-2 rounded-full bg-brand-secondary" style="background-color: var(--lime-vibrant) !important;"></div>
            <span>${entry.medicineName} (${entry.dosage})</span>
          `;
          medList.appendChild(li);
        });
      } else {
        medList.innerHTML = '<li class="text-[14px] text-primary/60 font-semibold">Nenhum medicamento programado</li>';
      }
    }

    // Insurance info
    const insName = document.getElementById('emergency-insurance-name');
    if (insName) insName.textContent = user.insuranceName || "Não cadastrado";
    const insNumber = document.getElementById('emergency-insurance-number');
    if (insNumber) insNumber.textContent = user.insuranceNumber || "-";
    const insCode = document.getElementById('emergency-insurance-code');
    if (insCode) insCode.textContent = user.insuranceCode || "-";

    // Medical notes
    const medNotes = document.getElementById('emergency-medical-notes');
    if (medNotes) medNotes.textContent = user.medicalNotes || "Nenhuma observação relevante.";

    // Render ICE Contacts
    const contactsContainer = document.getElementById('emergency-contacts-container');
    if (contactsContainer) {
      contactsContainer.innerHTML = `
        <!-- Contact 1 -->
        <div class="bg-white rounded-xl p-4 flex items-center justify-between shadow-clay-card active:scale-[0.98] transition-transform cursor-pointer group" onclick="alert('Ligando para Ana Silva (Esposa): (11) 98888-0000')">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-background flex items-center justify-center shadow-inner">
              <span class="material-symbols-outlined text-primary" data-icon="person">person</span>
            </div>
            <div class="text-left">
              <p class="text-[16px] font-semibold text-primary">Ana Silva</p>
              <p class="text-[14px] font-medium text-primary/60">Esposa • (11) 98888-0000</p>
            </div>
          </div>
          <div class="w-10 h-10 rounded-full bg-background flex items-center justify-center shadow-clay-btn">
            <span class="material-symbols-outlined text-primary text-[20px]" data-icon="call" style="font-variation-settings: 'FILL' 1;">call</span>
          </div>
        </div>
        <!-- Contact 2 -->
        <div class="bg-white rounded-xl p-4 flex items-center justify-between shadow-clay-card active:scale-[0.98] transition-transform cursor-pointer group" onclick="alert('Ligando para Dr. Roberto Santos (Cardiologista): (11) 97777-1111')">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-background flex items-center justify-center shadow-inner">
              <span class="material-symbols-outlined text-primary" data-icon="person">person</span>
            </div>
            <div class="text-left">
              <p class="text-[16px] font-semibold text-primary">Dr. Roberto Santos</p>
              <p class="text-[14px] font-medium text-primary/60">Cardiologista • (11) 97777-1111</p>
            </div>
          </div>
          <div class="w-10 h-10 rounded-full bg-background flex items-center justify-center shadow-clay-btn">
            <span class="material-symbols-outlined text-primary text-[20px]" data-icon="call" style="font-variation-settings: 'FILL' 1;">call</span>
          </div>
        </div>
      `;
    }

    // Render Location Details
    const locationVal = document.getElementById('emergency-location-val');
    if (locationVal && this.addresses && this.addresses.length > 0) {
      const primaryAddr = this.addresses[0];
      locationVal.textContent = `${primaryAddr.street}, ${primaryAddr.number} - ${primaryAddr.neighborhood}, ${primaryAddr.city}`;
    }
  }

  renderPurchaseHistory() {
    const listContainer = document.getElementById('history-items-container');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    const filterPeriod = document.getElementById('history-filter-period').value;
    const customStart = document.getElementById('history-filter-start').value;
    const customEnd = document.getElementById('history-filter-end').value;
    const searchMedicine = document.getElementById('history-filter-medicine').value.trim().toLowerCase();

    let filtered = [...this.purchaseHistory];

    // Ordena por data (mais recente primeiro)
    filtered.sort((a, b) => b.date.localeCompare(a.date));

    // 1. Filtrar por Período
    const now = new Date();
    if (filterPeriod !== 'custom') {
      let daysLimit = Infinity;
      if (filterPeriod === '7') daysLimit = 7;
      else if (filterPeriod === '30') daysLimit = 30;
      else if (filterPeriod === '90') daysLimit = 90;
      else if (filterPeriod === '180') daysLimit = 180;
      else if (filterPeriod === '365') daysLimit = 365;

      if (daysLimit !== Infinity) {
        const limitDate = new Date();
        limitDate.setDate(now.getDate() - daysLimit);
        filtered = filtered.filter(item => new Date(item.date) >= limitDate);
      }
    } else {
      if (customStart) {
        filtered = filtered.filter(item => item.date >= customStart);
      }
      if (customEnd) {
        filtered = filtered.filter(item => item.date <= customEnd);
      }
    }

    // 2. Filtrar por Medicamento
    if (searchMedicine) {
      filtered = filtered.filter(item => 
        item.medicines.some(m => m.name.toLowerCase().includes(searchMedicine))
      );
    }

    // CALCULOS DO DASHBOARD
    const totalPurchases = filtered.length;
    let totalSpent = 0;
    let totalSavings = 0;
    const medCounts = {};
    let lastPurchaseInfo = "Nenhuma compra no período";

    filtered.forEach((item, idx) => {
      totalSpent += item.total;
      totalSavings += (item.savings || 0);
      
      // Tally para medicamento mais comprado
      item.medicines.forEach(m => {
        medCounts[m.name] = (medCounts[m.name] || 0) + m.quantity;
      });

      if (idx === 0) {
        const dateFormatted = item.date.split('-').reverse().join('/');
        lastPurchaseInfo = `${dateFormatted} • ${item.pharmacy} (R$ ${item.total.toFixed(2).replace('.', ',')})`;
      }
    });

    // Encontra medicamento mais comprado
    let topMed = "Nenhum";
    let maxCount = 0;
    Object.keys(medCounts).forEach(name => {
      if (medCounts[name] > maxCount) {
        maxCount = medCounts[name];
        topMed = name;
      }
    });

    // Média Mensal
    let months = 1;
    if (filterPeriod === '7') months = 7/30;
    else if (filterPeriod === '30') months = 1;
    else if (filterPeriod === '90') months = 3;
    else if (filterPeriod === '180') months = 6;
    else if (filterPeriod === '365') months = 12;
    else if (filtered.length > 0) {
      const dates = filtered.map(h => new Date(h.date));
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));
      const diffTime = Math.abs(maxDate - minDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      months = Math.max(1, Math.round(diffDays / 30));
    }
    const monthlyAverage = totalSpent / months;

    // Atualiza elementos do Dashboard no DOM
    document.getElementById('history-metric-purchases').textContent = totalPurchases;
    document.getElementById('history-metric-spent').textContent = `R$ ${totalSpent.toFixed(2).replace('.', ',')}`;
    document.getElementById('history-metric-average').textContent = `R$ ${monthlyAverage.toFixed(2).replace('.', ',')}`;
    document.getElementById('history-metric-savings').textContent = `R$ ${totalSavings.toFixed(2).replace('.', ',')}`;
    document.getElementById('history-metric-top-med').textContent = topMed;
    document.getElementById('history-metric-last-purchase').textContent = lastPurchaseInfo;

    // RENDERIZA LISTA
    if (filtered.length === 0) {
      listContainer.innerHTML = '<div style="text-align:center; padding: 30px; color: var(--on-surface-variant); font-size: 13px;">Nenhuma compra encontrada no período selecionado.</div>';
      return;
    }

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'recent-purchase-card glassmorphism-card';
      card.style.flexDirection = 'column';
      card.style.alignItems = 'stretch';
      card.style.gap = '10px';
      card.style.padding = '14px';

      const dateFormatted = item.date.split('-').reverse().join('/');
      let medsHtml = item.medicines.map(m => `
        <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--on-surface-variant);">
          <span>• ${m.name} (x${m.quantity})</span>
          <span>R$ ${(m.price * m.quantity).toFixed(2).replace('.', ',')}</span>
        </div>
      `).join('');

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--surface-container-high); padding-bottom:6px;">
          <div>
            <span style="font-size:12px; font-weight:800; color:var(--primary);">${item.pharmacy}</span>
            <span style="font-size:11px; color:var(--on-surface-variant); margin-left:8px;">${dateFormatted}</span>
          </div>
          <span class="status-badge" style="background-color:rgba(68, 105, 0, 0.1); color:var(--primary); font-size:10px; font-weight:800; padding:2px 6px; border-radius:4px;">${item.status}</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:4px; padding:2px 0;">
          ${medsHtml}
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--surface-container-high); padding-top:8px; font-size:12px; font-weight:700;">
          <div style="color:var(--on-surface-variant);">
            Pagam: <span style="color:var(--on-surface); font-weight:800;">${item.paymentMethod}</span>
            ${item.savings > 0 ? `<br><span style="color:#32bcad; font-size:10px;">Economia: R$ ${item.savings.toFixed(2).replace('.', ',')}</span>` : ''}
          </div>
          <div style="text-align:right;">
            Total: <span style="font-size:14px; font-weight:900; color:var(--primary);">R$ ${item.total.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
        <button class="purchase-repeat-btn" onclick="app.repeatPurchaseFromHistory('${item.id}')" style="margin-top:4px; width:100%;">Repetir Pedido Completo</button>
      `;
      listContainer.appendChild(card);
    });
  }

  repeatPurchaseFromHistory(orderId) {
    const order = this.purchaseHistory.find(h => h.id === orderId);
    if (!order) return;

    // Limpa itens antigos do tipo cotação
    this.cart = this.cart.filter(item => item.type !== 'quote');

    order.medicines.forEach(m => {
      this.cart.push({
        type: 'quote',
        id: m.id,
        name: m.name,
        brand: m.brand || 'Genérico',
        price: m.price,
        quantity: m.quantity,
        pharmacyId: order.pharmacy.toLowerCase().replace(/\s/g, ''),
        image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=100'
      });
    });

    this.saveCart();
    this.updateCartBadge();
    alert("Pedido completo adicionado ao carrinho!");
    this.navigateTo('screen-cart');
  }
}

// Inicializa a aplicação tratando a condição de corrida do DOMContentLoaded
function startApp() {
  if (!window.app) {
    window.app = new MediqiaApp();
    window.app.init();
    
    // Efeito sticky do header ao scroll
    const container = document.getElementById('screen-container');
    const header = document.querySelector('header.app-header');
    
    if (container && header) {
      container.addEventListener('scroll', () => {
        if (container.scrollTop > 20) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      });
    }
  }
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  startApp();
} else {
  document.addEventListener('DOMContentLoaded', startApp);
}
