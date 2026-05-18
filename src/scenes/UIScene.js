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

        this.registry.events.off('changedata-finalResult');
        this.registry.events.on('changedata-finalResult', (parent, value) => {
            if (value) this.showResultPanel(value);
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

    refreshBoardRows(leaderboard, panelX, listStartY, rowH) {
        if (this.boardScrollLayer) {
            this.boardScrollLayer.removeAll(true);
        }

        const visibleStart = Math.floor(this.boardScrollOffset / rowH);
        const visibleEnd = Math.min(leaderboard.length, visibleStart + 5);

        for (let i = visibleStart; i < visibleEnd; i++) {
            const entry = leaderboard[i];
            const rowY = listStartY + i * rowH - this.boardScrollOffset;
            const isCurrent = entry.date === this.registry.get('finalResult')?.date &&
                entry.score === this.registry.get('finalResult')?.score &&
                entry.kills === this.registry.get('finalResult')?.zombiesKilled;
            const rankText = i + 1 < 4 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}`;
            const rankColor = i + 1 < 4 ? '#ffd700' : '#cccccc';
            const winColor = entry.isWin ? '#4caf50' : '#ff5555';
            const winText = entry.isWin ? '胜利' : '失败';
            const highlightColor = isCurrent ? '#ffd700' : '#ffffff';

            this.boardScrollLayer.add([
                this.add.text(panelX + 30, rowY, rankText, {
                    fontSize: '16px', fontFamily: 'Outfit', fill: rankColor
                }).setOrigin(0, 0.5),
                this.add.text(panelX + 70, rowY, `${entry.score}`, {
                    fontSize: '16px', fontFamily: 'Outfit', fill: highlightColor
                }).setOrigin(0, 0.5),
                this.add.text(panelX + 220, rowY, `${entry.kills}`, {
                    fontSize: '16px', fontFamily: 'Outfit', fill: '#cccccc'
                }).setOrigin(0, 0.5),
                this.add.text(panelX + 290, rowY, `${entry.plantsRemaining}`, {
                    fontSize: '16px', fontFamily: 'Outfit', fill: '#cccccc'
                }).setOrigin(0, 0.5),
                this.add.text(panelX + 360, rowY, winText, {
                    fontSize: '16px', fontFamily: 'Outfit', fill: winColor
                }).setOrigin(0, 0.5),
                this.add.text(panelX + 440, rowY, entry.date, {
                    fontSize: '13px', fontFamily: 'Outfit', fill: '#999999'
                }).setOrigin(0, 0.5)
            ]);
        }
    }

    showResultPanel(result) {
        const { width, height } = this.scale;

        const panelW = 640;
        const panelH = 680;
        const panelX = width / 2 - panelW / 2;
        const panelY = height / 2 - panelH / 2 + 40;

        this.resultLayer = this.add.container(0, 0);

        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x1a1a1a, 0.95);
        panelBg.fillRoundedRect(panelX, panelY, panelW, panelH, 20);
        panelBg.lineStyle(3, result.isWin ? 0xffd700 : 0xff5555, 1);
        panelBg.strokeRoundedRect(panelX, panelY, panelW, panelH, 20);
        this.resultLayer.add(panelBg);

        this.resultLayer.add(
            this.add.text(width / 2, panelY + 50, '本 局 结 算', {
                fontSize: '40px', fontFamily: 'ZCOOL KuaiLe', fill: '#ffffff'
            }).setOrigin(0.5)
        );

        this.resultLayer.add(
            this.add.text(width / 2, panelY + 95, result.msg, {
                fontSize: '24px', fontFamily: 'ZCOOL KuaiLe', fill: result.color
            }).setOrigin(0.5)
        );

        const scoreItems = [
            { label: '击杀僵尸', value: result.zombiesKilled, sub: `× 100 = ${result.killScore}` },
            { label: '剩余植物', value: result.plantsRemaining, sub: `× 50 = ${result.plantScore}` }
        ];
        if (result.isWin) {
            scoreItems.push({ label: '胜利奖励', value: '+500', sub: 'Bonus' });
        }

        let lineY = panelY + 150;
        scoreItems.forEach(item => {
            this.resultLayer.add(
                this.add.text(width / 2 - 180, lineY, item.label, {
                    fontSize: '22px', fontFamily: 'Outfit', fill: '#cccccc'
                }).setOrigin(0, 0.5)
            );
            this.resultLayer.add(
                this.add.text(width / 2 + 200, lineY, item.value, {
                    fontSize: '22px', fontFamily: 'Outfit', fill: '#ffffff'
                }).setOrigin(1, 0.5)
            );
            this.resultLayer.add(
                this.add.text(width / 2 + 200, lineY + 20, item.sub, {
                    fontSize: '16px', fontFamily: 'Outfit', fill: '#888888'
                }).setOrigin(1, 0.5)
            );
            lineY += 55;
        });

        const totalBar = this.add.graphics();
        totalBar.fillStyle(0x444444, 0.8);
        totalBar.fillRoundedRect(width / 2 - 200, lineY + 10, 400, 55, 12);
        this.resultLayer.add(totalBar);

        this.resultLayer.add(
            this.add.text(width / 2, lineY + 38, `总分  ${result.score}`, {
                fontSize: '32px', fontFamily: 'ZCOOL KuaiLe', fill: '#ffd700'
            }).setOrigin(0.5)
        );

        const boardTitleY = lineY + 105;
        this.resultLayer.add(
            this.add.text(width / 2, boardTitleY, '🏆 历 史 排 行 榜', {
                fontSize: '26px', fontFamily: 'ZCOOL KuaiLe', fill: '#ffd700'
            }).setOrigin(0.5)
        );

        const boardTopY = boardTitleY + 35;
        const boardHeaderY = boardTopY + 25;
        this.resultLayer.add(
            this.add.text(panelX + 30, boardHeaderY, '#', {
                fontSize: '16px', fontFamily: 'Outfit', fill: '#888888'
            }),
            this.add.text(panelX + 70, boardHeaderY, '分数', {
                fontSize: '16px', fontFamily: 'Outfit', fill: '#888888'
            }),
            this.add.text(panelX + 220, boardHeaderY, '击杀', {
                fontSize: '16px', fontFamily: 'Outfit', fill: '#888888'
            }),
            this.add.text(panelX + 290, boardHeaderY, '植物', {
                fontSize: '16px', fontFamily: 'Outfit', fill: '#888888'
            }),
            this.add.text(panelX + 360, boardHeaderY, '结果', {
                fontSize: '16px', fontFamily: 'Outfit', fill: '#888888'
            }),
            this.add.text(panelX + 440, boardHeaderY, '日期', {
                fontSize: '16px', fontFamily: 'Outfit', fill: '#888888'
            })
        );

        const leaderboard = result.leaderboard || [];
        const listStartY = boardHeaderY + 28;
        const listMaxRows = 5;
        const rowH = 30;
        const listMaxH = listMaxRows * rowH;
        const totalListH = leaderboard.length * rowH;

        this.boardScrollOffset = 0;

        this.boardScrollLayer = this.add.container(0, 0);
        this.resultLayer.add(this.boardScrollLayer);

        this.boardScissor = this.add.graphics();
        this.boardScissor.fillStyle(0x000000, 1);
        this.boardScissor.fillRect(panelX + 10, listStartY, panelW - 20, listMaxH);
        this.resultLayer.add(this.boardScissor);

        this.refreshBoardRows(leaderboard, panelX, listStartY, rowH);

        if (totalListH > listMaxH) {
            const upBtn = this.add.text(panelX + panelW - 25, boardHeaderY - 5, '▲', {
                fontSize: '16px', fontFamily: 'Outfit', fill: '#ffd700'
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });
            upBtn.on('pointerdown', () => {
                if (this.boardScrollOffset > 0) {
                    this.boardScrollOffset -= rowH;
                    this.refreshBoardRows(leaderboard, panelX, listStartY, rowH);
                }
            });
            this.resultLayer.add(upBtn);

            const downBtn = this.add.text(panelX + panelW - 25, listStartY + listMaxH + 20, '▼', {
                fontSize: '16px', fontFamily: 'Outfit', fill: '#ffd700'
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });
            downBtn.on('pointerdown', () => {
                if (this.boardScrollOffset < totalListH - listMaxH) {
                    this.boardScrollOffset += rowH;
                    this.refreshBoardRows(leaderboard, panelX, listStartY, rowH);
                }
            });
            this.resultLayer.add(downBtn);
        }

        const btnY = panelY + panelH - 70;
        const btnW = 200;
        const btnH = 60;
        const btnX = width / 2;

        const btnContainer = this.add.container(btnX, btnY);
        const btnBg = this.add.graphics();
        btnBg.fillStyle(0x4caf50, 1);
        btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 15);

        const btnText = this.add.text(0, 0, '再 来 一 局', {
            fontSize: '26px', fontFamily: 'ZCOOL KuaiLe', fill: '#ffffff'
        }).setOrigin(0.5);

        btnContainer.add([btnBg, btnText]);
        btnContainer.setSize(btnW, btnH);
        btnContainer.setInteractive({ useHandCursor: true });

        btnContainer.on('pointerover', () => btnContainer.setScale(1.08));
        btnContainer.on('pointerout', () => btnContainer.setScale(1));

        btnContainer.on('pointerdown', () => {
            this.scene.get('PlayScene').scene.restart();
            this.scene.restart();
        });

        this.resultLayer.add(btnContainer);
    }
}
