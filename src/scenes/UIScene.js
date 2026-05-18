import Phaser from 'phaser';
import { COLORS, PLANTS } from '../constants';

export class UIScene extends Phaser.Scene {
    constructor() {
        super('UIScene');
    }

    create() {
        const { height } = this.scale;

        // Wider Sidebar for 3 columns (Total width ~220)
        const sidebarWidth = 220;

        // Sun Panel (Vertical Sidebar Top)
        const sunPanel = this.add.graphics();
        sunPanel.fillStyle(0x3e2723, 0.95);
        sunPanel.fillRoundedRect(10, 10, sidebarWidth - 20, 90, 15);
        sunPanel.lineStyle(3, 0xffd700, 0.3);
        sunPanel.strokeRoundedRect(10, 10, sidebarWidth - 20, 90, 15);

        this.sunIcon = this.add.image(50, 55, 'sun').setScale(0.9);

        // Fix: Read initial sun from registry instead of hardcoding '50'
        const currentSun = this.registry.get('sun') !== undefined ? this.registry.get('sun') : 50;
        this.sunText = this.add.text(85, 55, currentSun.toString(), {
            fontSize: '34px',
            fontFamily: 'Outfit',
            fill: '#ffd700',
            fontWeight: '900',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0, 0.5);

        // Sidebar Background
        const cardSidebar = this.add.graphics();
        cardSidebar.fillStyle(0x000000, 0.5);
        cardSidebar.fillRoundedRect(10, 110, sidebarWidth - 20, height - 125, 15);

        this.createPlantCards(sidebarWidth);

        this.registry.events.on('changedata-sun', (parent, value) => {
            this.sunText.setText(value);
            this.updateCardAvailability(value);
        });

        // Ensure availability is correct at start
        this.updateCardAvailability(currentSun);
    }

    createPlantCards(sidebarWidth) {
        const startY = 160;
        const keys = Object.keys(PLANTS);
        this.cards = {};

        keys.forEach((key, index) => {
            const data = PLANTS[key];
            // 3 columns to fit 20 plants vertically without overflow
            const col = index % 3;
            const row = Math.floor(index / 3);

            // Layout within sidebarWidth
            const x = 45 + col * 65;
            const y = startY + row * 85;

            const card = this.add.container(x, y);

            const bg = this.add.graphics();
            this.drawCardBg(bg, 0x333333, 0.1);

            const icon = this.add.sprite(0, -10, key.toLowerCase()).setScale(0.4);

            const costText = this.add.text(0, 22, data.cost, {
                fontSize: '14px',
                fontFamily: 'Outfit',
                fill: '#ffd700',
                fontWeight: 'bold'
            }).setOrigin(0.5);

            card.add([bg, icon, costText]);
            card.setSize(60, 80);
            card.setInteractive({ useHandCursor: true });

            card.on('pointerover', () => {
                const currentSun = this.registry.get('sun');
                if (currentSun >= data.cost) {
                    card.setScale(1.1);
                    this.drawCardBg(bg, 0x444444, 0.4);
                }
            });

            card.on('pointerout', () => {
                card.setScale(1);
                const isSelected = this.registry.get('selectedPlant') === key;
                this.drawCardBg(bg, isSelected ? 0x4caf50 : 0x333333, isSelected ? 0.9 : 0.1);
            });

            card.on('pointerdown', () => {
                const currentSun = this.registry.get('sun');
                if (currentSun >= data.cost) {
                    this.registry.set('selectedPlant', key);
                    this.highlightCard(key);
                } else {
                    // Feedback for can't afford
                    this.cameras.main.shake(100, 0.002);
                }
            });

            this.cards[key] = { card, bg };
        });
    }

    drawCardBg(graphics, color, lineAlpha) {
        graphics.clear();
        graphics.fillStyle(color, 0.9);
        graphics.fillRoundedRect(-28, -40, 56, 80, 8);
        graphics.lineStyle(2, 0xffffff, lineAlpha);
        graphics.strokeRoundedRect(-28, -40, 56, 80, 8);
    }

    highlightCard(selectedKey) {
        Object.keys(this.cards).forEach(key => {
            const { bg } = this.cards[key];
            const isSel = key === selectedKey;
            this.drawCardBg(bg, isSel ? 0x4caf50 : 0x333333, isSel ? 0.9 : 0.1);
        });
    }

    updateCardAvailability(currentSun) {
        Object.keys(this.cards).forEach(key => {
            const data = PLANTS[key];
            const { card } = this.cards[key];
            if (currentSun < data.cost) {
                card.setAlpha(0.3);
            } else {
                card.setAlpha(1);
            }
        });
    }
}
