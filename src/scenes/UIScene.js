import Phaser from 'phaser';
import { COLORS, PLANTS } from '../constants';

const STORAGE_KEY = 'pvz_leaderboard';

export class UIScene extends Phaser.Scene {
    constructor() {
        super('UIScene');
    }

    create() {
        const { height } = this.scale;

        this.scorePanelContainer = null;
        this.leaderboardContainer = null;

        const sidebarWidth = 220;

        const sunPanel = this.add.graphics();
        sunPanel.fillStyle(0x3e2723, 0.95);
        sunPanel.fillRoundedRect(10, 10, sidebarWidth - 20, 90, 15);
        sunPanel.lineStyle(3, 0xffd700, 0.3);
        sunPanel.strokeRoundedRect(10, 10, sidebarWidth - 20, 90, 15);

        this.sunIcon = this.add.image(50, 55, 'sun').setScale(0.9);

        const currentSun = this.registry.get('sun') !== undefined ? this.registry.get('sun') : 50;
        this.sunText = this.add.text(85, 55, currentSun.toString(), {
            fontSize: '34px',
            fontFamily: 'Outfit',
            fill: '#ffd700',
            fontWeight: '900',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0, 0.5);

        const cardSidebar = this.add.graphics();
        cardSidebar.fillStyle(0x000000, 0.5);
        cardSidebar.fillRoundedRect(10, 110, sidebarWidth - 20, height - 125, 15);

        this.createPlantCards(sidebarWidth);

        this.createLeaderboardButton(sidebarWidth);

        this.registry.events.on('changedata-sun', (parent, value) => {
            this.sunText.setText(value);
            this.updateCardAvailability(value);
        });

        this.updateCardAvailability(currentSun);
    }

    createLeaderboardButton(sidebarWidth) {
        const btn = this.add.container(sidebarWidth / 2, this.scale.height - 30);
        const bg = this.add.graphics();
        bg.fillStyle(0x5d4037, 1);
        bg.fillRoundedRect(-80, -22, 160, 44, 12);
        bg.lineStyle(2, 0xffd700, 0.5);
        bg.strokeRoundedRect(-80, -22, 160, 44, 12);

        const txt = this.add.text(0, 0, '🏆 排行榜', {
            fontSize: '20px',
            fontFamily: 'ZCOOL KuaiLe',
            fill: '#ffd700'
        }).setOrigin(0.5);

        btn.add([bg, txt]);
        btn.setSize(160, 44);
        btn.setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => { btn.setScale(1.08); });
        btn.on('pointerout', () => { btn.setScale(1); });
        btn.on('pointerdown', () => { this.toggleLeaderboard(); });
    }

    toggleLeaderboard() {
        if (this.leaderboardContainer) {
            this.closeLeaderboard();
            return;
        }
        this.showLeaderboardPanel();
    }

    showLeaderboardPanel() {
        if (this.leaderboardContainer) {
            this.leaderboardContainer.destroy();
        }
        if (this.leaderboardOverlay) {
            this.leaderboardOverlay.destroy();
        }

        const { width, height } = this.scale;
        const panelW = 500;
        const panelH = 500;
        const px = (width - panelW) / 2;
        const py = (height - panelH) / 2;

        this.leaderboardOverlay = this.add.graphics();
        this.leaderboardOverlay.fillStyle(0x000000, 0.7);
        this.leaderboardOverlay.fillRect(0, 0, width, height);
        this.leaderboardOverlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);
        this.leaderboardOverlay.setDepth(998);
        this.leaderboardOverlay.on('pointerdown', () => {
            this.closeLeaderboard();
        });

        this.leaderboardContainer = this.add.container(px, py);
        this.leaderboardContainer.setDepth(999);

        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x1a1a2e, 0.95);
        panelBg.fillRoundedRect(0, 0, panelW, panelH, 20);
        panelBg.lineStyle(3, 0xffd700, 0.6);
        panelBg.strokeRoundedRect(0, 0, panelW, panelH, 20);

        const title = this.add.text(panelW / 2, 35, '🏆 历史排行榜 TOP 10', {
            fontSize: '28px',
            fontFamily: 'ZCOOL KuaiLe',
            fill: '#ffd700',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        const header = this.add.text(panelW / 2, 75, '排名       得分       击杀       植物       日期', {
            fontSize: '16px',
            fontFamily: 'ZCOOL KuaiLe',
            fill: '#aaaaaa'
        }).setOrigin(0.5);

        const divider = this.add.graphics();
        divider.lineStyle(1, 0xffd700, 0.3);
        divider.lineBetween(30, 95, panelW - 30, 95);

        const entries = [];
        let leaderboard = [];
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) leaderboard = JSON.parse(raw);
        } catch (e) { /* ignore */ }

        leaderboard.forEach((entry, i) => {
            const rowY = 115 + i * 36;
            const medalColors = ['#ffd700', '#c0c0c0', '#cd7f32'];
            const color = i < 3 ? medalColors[i] : '#cccccc';
            const rankLabel = i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}`;

            const row = this.add.text(panelW / 2, rowY,
                `${rankLabel}          ${entry.score}          ${entry.zombiesKilled}          ${entry.plantsAlive}          ${entry.date}`, {
                    fontSize: '18px',
                    fontFamily: 'ZCOOL KuaiLe',
                    fill: color
                }).setOrigin(0.5);
            entries.push(row);
        });

        if (leaderboard.length === 0) {
            const empty = this.add.text(panelW / 2, 250, '暂无记录，快来挑战吧！', {
                fontSize: '22px',
                fontFamily: 'ZCOOL KuaiLe',
                fill: '#888888'
            }).setOrigin(0.5);
            entries.push(empty);
        }

        const closeBtn = this.add.container(panelW - 40, 30);
        const closeBg = this.add.graphics();
        closeBg.fillStyle(0xff5555, 1);
        closeBg.fillCircle(0, 0, 16);
        const closeTxt = this.add.text(0, 0, '✕', {
            fontSize: '18px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        closeBtn.add([closeBg, closeTxt]);
        closeBtn.setSize(32, 32);
        closeBtn.setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => {
            this.closeLeaderboard();
        });

        this.leaderboardContainer.add([panelBg, title, header, divider, ...entries, closeBtn]);
    }

    closeLeaderboard() {
        if (this.leaderboardContainer) {
            this.leaderboardContainer.destroy();
            this.leaderboardContainer = null;
        }
        if (this.leaderboardOverlay) {
            this.leaderboardOverlay.destroy();
            this.leaderboardOverlay = null;
        }
    }

    showScorePanel(scoreData, leaderboard) {
        if (this.scorePanelContainer) {
            this.scorePanelContainer.destroy();
        }

        const sidebarWidth = 220;
        const panelX = 10;
        const panelY = 110;

        this.scorePanelContainer = this.add.container(panelX, panelY);

        const bg = this.add.graphics();
        bg.fillStyle(0x1b5e20, 0.95);
        bg.fillRoundedRect(0, 0, sidebarWidth - 20, 160, 12);
        bg.lineStyle(2, 0xffd700, 0.6);
        bg.strokeRoundedRect(0, 0, sidebarWidth - 20, 160, 12);

        const title = this.add.text((sidebarWidth - 20) / 2, 20, '📊 本局结算', {
            fontSize: '18px',
            fontFamily: 'ZCOOL KuaiLe',
            fill: '#ffd700'
        }).setOrigin(0.5);

        const killText = this.add.text(15, 48, `🧟 击杀: ${scoreData.zombiesKilled} ×100 = ${scoreData.zombieScore}`, {
            fontSize: '14px',
            fontFamily: 'ZCOOL KuaiLe',
            fill: '#cccccc'
        });

        const plantText = this.add.text(15, 72, `🌱 植物: ${scoreData.plantsAlive} ×50 = ${scoreData.plantScore}`, {
            fontSize: '14px',
            fontFamily: 'ZCOOL KuaiLe',
            fill: '#cccccc'
        });

        let yOffset = 96;
        if (scoreData.winBonus > 0) {
            const bonusText = this.add.text(15, yOffset, `⭐ 通关奖励: +${scoreData.winBonus}`, {
                fontSize: '14px',
                fontFamily: 'ZCOOL KuaiLe',
                fill: '#ffd700'
            });
            this.scorePanelContainer.add(bonusText);
            yOffset += 24;
        }

        const totalText = this.add.text(15, yOffset, `总分: ${scoreData.total}`, {
            fontSize: '20px',
            fontFamily: 'ZCOOL KuaiLe',
            fill: '#ffd700',
            stroke: '#000000',
            strokeThickness: 3
        });

        this.scorePanelContainer.add([bg, title, killText, plantText, totalText]);
        this.scorePanelContainer.setDepth(100);
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
