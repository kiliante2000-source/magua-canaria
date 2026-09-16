(() => {
    document.documentElement.classList.add("js");

    const header = document.getElementById("cabecera");
    const menuToggle = document.getElementById("menu-toggle");
    const nav = document.getElementById("menu-principal");
    const progress = document.getElementById("progress");
    const toTop = document.getElementById("to-top");
    const lightbox = document.getElementById("lightbox");
    const lightboxImage = document.getElementById("lightbox-image");
    const lightboxTitle = document.getElementById("lightbox-title");
    const toast = document.getElementById("toast");
    const pledgeCount = document.getElementById("pledge-count");
    const glow = document.getElementById("pointer-glow");
    const cursorSun = document.getElementById("cursor-sun");
    const navLinks = [...nav.querySelectorAll("a")];
    const sections = [...document.querySelectorAll("main section[id], #contacto")];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    const closeNav = () => {
        document.body.classList.remove("nav-open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.querySelector(".visually-hidden").textContent = "Abrir menú";
    };

    const openNav = () => {
        document.body.classList.add("nav-open");
        menuToggle.setAttribute("aria-expanded", "true");
        menuToggle.querySelector(".visually-hidden").textContent = "Cerrar menú";
        navLinks[0]?.focus();
    };

    menuToggle.addEventListener("click", () => {
        if (document.body.classList.contains("nav-open")) {
            closeNav();
        } else {
            openNav();
        }
    });

    navLinks.forEach((link) => link.addEventListener("click", closeNav));

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeNav();
            if (lightbox.open) {
                lightbox.close();
            }
        }
    });

    const onScroll = () => {
        const scrolled = window.scrollY;
        const height = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = `${height > 0 ? (scrolled / height) * 100 : 0}%`;
        header.classList.toggle("is-scrolled", scrolled > 12);
        toTop.classList.toggle("is-visible", scrolled > 500);

        const marker = scrolled + header.offsetHeight + 80;
        let current = sections[0]?.id;
        sections.forEach((section) => {
            if (section.offsetTop <= marker) {
                current = section.id;
            }
        });
        navLinks.forEach((link) => {
            link.classList.toggle("is-active", link.getAttribute("href") === `#${current}`);
        });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    toTop.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });

    const showToast = (message) => {
        toast.hidden = false;
        toast.textContent = message;
        toast.classList.add("is-on");
        window.clearTimeout(showToast.timer);
        showToast.timer = window.setTimeout(() => {
            toast.classList.remove("is-on");
        }, 2400);
    };

    const axisTabs = [...document.querySelectorAll(".axis-tabs [role='tab']")];
    const posterStages = [...document.querySelectorAll(".poster-stage")];

    const activateAxis = (axis) => {
        axisTabs.forEach((tab) => {
            const on = tab.dataset.axis === axis;
            tab.classList.toggle("is-on", on);
            tab.setAttribute("aria-selected", String(on));
            tab.tabIndex = on ? 0 : -1;
        });
        posterStages.forEach((stage) => {
            const on = stage.dataset.axis === axis;
            stage.classList.toggle("is-on", on);
            stage.hidden = !on;
        });
    };

    axisTabs.forEach((tab, index) => {
        tab.tabIndex = tab.classList.contains("is-on") ? 0 : -1;
        tab.addEventListener("click", () => activateAxis(tab.dataset.axis));
        tab.addEventListener("keydown", (event) => {
            const next = event.key === "ArrowRight" || event.key === "ArrowDown";
            const prev = event.key === "ArrowLeft" || event.key === "ArrowUp";
            if (!next && !prev) {
                return;
            }
            event.preventDefault();
            const target = axisTabs[(index + (next ? 1 : -1) + axisTabs.length) % axisTabs.length];
            activateAxis(target.dataset.axis);
            target.focus();
        });
    });

    const jumpTo = (selector) => {
        const target = document.querySelector(selector);
        if (!target) {
            return;
        }
        closeNav();
        if (target.matches("[role='tab']") && target.dataset.axis) {
            activateAxis(target.dataset.axis);
            document.getElementById("carteles")?.scrollIntoView({
                behavior: reduceMotion ? "auto" : "smooth",
                block: "start"
            });
            return;
        }
        target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    };

    document.querySelectorAll("[data-jump]").forEach((el) => {
        el.addEventListener("click", () => jumpTo(el.dataset.jump));
    });

    const rotateStack = (stack, direction) => {
        const posters = [...stack.querySelectorAll(".poster")];
        const order = direction === "next"
            ? { left: "right", center: "left", right: "center" }
            : { left: "center", center: "right", right: "left" };

        posters.forEach((poster) => {
            const nextPos = order[poster.dataset.pos];
            poster.dataset.pos = nextPos;
            poster.classList.toggle("is-front", nextPos === "center");
            const label = poster.getAttribute("aria-label").replace(/Traer al frente|Ya está al frente/, "");
            poster.setAttribute(
                "aria-label",
                `${label}${nextPos === "center" ? "Ya está al frente" : "Traer al frente"}`
            );
        });
    };

    const bringToFront = (stack, poster) => {
        if (poster.dataset.pos === "center") {
            return;
        }
        rotateStack(stack, poster.dataset.pos === "right" ? "next" : "prev");
    };

    const openLightbox = (src, title, alt) => {
        lightboxImage.src = src;
        lightboxImage.alt = alt || title;
        lightboxTitle.textContent = title;
        if (typeof lightbox.showModal === "function") {
            lightbox.showModal();
        }
    };

    document.querySelectorAll(".poster-stage").forEach((theme) => {
        const stack = theme.querySelector(".poster-stack");
        const tab = document.getElementById(theme.getAttribute("aria-labelledby"));
        const title = tab ? tab.textContent.trim() : theme.querySelector(".stage-kicker").textContent;
        let startX = 0;

        stack.setAttribute("tabindex", "0");

        stack.querySelectorAll(".poster").forEach((poster) => {
            poster.addEventListener("click", () => {
                if (poster.dataset.pos === "center") {
                    openLightbox(poster.dataset.full, title, poster.querySelector("img").alt);
                    return;
                }
                bringToFront(stack, poster);
            });
        });

        theme.querySelector("[data-dir='prev']").addEventListener("click", () => rotateStack(stack, "prev"));
        theme.querySelector("[data-dir='next']").addEventListener("click", () => rotateStack(stack, "next"));
        theme.querySelector("[data-action='zoom']").addEventListener("click", () => {
            const front = stack.querySelector('.poster[data-pos="center"]');
            openLightbox(front.dataset.full, title, front.querySelector("img").alt);
        });

        stack.addEventListener("keydown", (event) => {
            if (event.key === "ArrowRight") {
                rotateStack(stack, "next");
            }
            if (event.key === "ArrowLeft") {
                rotateStack(stack, "prev");
            }
        });

        stack.addEventListener("touchstart", (event) => {
            startX = event.changedTouches[0].clientX;
        }, { passive: true });

        stack.addEventListener("touchend", (event) => {
            const delta = event.changedTouches[0].clientX - startX;
            if (Math.abs(delta) > 40) {
                rotateStack(stack, delta < 0 ? "next" : "prev");
            }
        }, { passive: true });
    });

    document.querySelectorAll("[data-lightbox='trajes']").forEach((button) => {
        button.addEventListener("click", () => {
            openLightbox(
                "img/Magos_Ordenador.png",
                "Trajes típicos canarios",
                "Infografía de trajes típicos de pescador y campesina con precios aproximados"
            );
        });
    });

    const updatePledges = () => {
        const total = document.querySelectorAll(".tip-panel button.is-active").length;
        pledgeCount.textContent = String(total);
    };

    document.querySelectorAll(".tip-panel button:not([data-lightbox])").forEach((button) => {
        button.setAttribute("aria-pressed", "false");
        button.addEventListener("click", () => {
            const active = button.classList.toggle("is-active");
            button.setAttribute("aria-pressed", String(active));
            updatePledges();
            showToast(active ? "¡Chacho! Este gesto suma." : "Has soltado este gesto.");
        });
    });

    lightbox.addEventListener("click", (event) => {
        if (event.target === lightbox) {
            lightbox.close();
        }
    });

    if (finePointer && !reduceMotion) {
        document.body.classList.add("has-pointer");
        window.addEventListener("pointermove", (event) => {
            glow.style.left = `${event.clientX}px`;
            glow.style.top = `${event.clientY}px`;
            cursorSun.style.left = `${event.clientX}px`;
            cursorSun.style.top = `${event.clientY}px`;
        }, { passive: true });
    }

    const hero = document.getElementById("inicio");
    const brandMark = document.getElementById("brand-mark");
    const brandSunHit = document.getElementById("brand-sun-hit");
    const floatBits = [...document.querySelectorAll(".float-bit, .hero-stamp")];

    const bitState = new Map(floatBits.map((el) => [el, { x: 0, y: 0, held: false }]));

    const applyBit = (el) => {
        const state = bitState.get(el);
        el.style.setProperty("--dx", `${state.x}px`);
        el.style.setProperty("--dy", `${state.y}px`);
    };

    floatBits.forEach((el) => {
        let startX = 0;
        let startY = 0;
        let originX = 0;
        let originY = 0;
        let moved = 0;

        el.addEventListener("pointerdown", (event) => {
            const state = bitState.get(el);
            state.held = true;
            moved = 0;
            startX = event.clientX;
            startY = event.clientY;
            originX = state.x;
            originY = state.y;
            el.classList.add("is-held");
            el.setPointerCapture(event.pointerId);
        });

        el.addEventListener("pointermove", (event) => {
            const state = bitState.get(el);
            if (!state.held) {
                return;
            }
            const dx = event.clientX - startX;
            const dy = event.clientY - startY;
            moved = Math.max(moved, Math.hypot(dx, dy));
            state.x = originX + dx;
            state.y = originY + dy;
            applyBit(el);
        });

        const release = (event) => {
            const state = bitState.get(el);
            if (!state.held) {
                return;
            }
            state.held = false;
            el.classList.remove("is-held");
            if (moved < 8) {
                el.classList.remove("is-spin");
                void el.offsetWidth;
                el.classList.add("is-spin");
                window.setTimeout(() => el.classList.remove("is-spin"), 800);
            }
            if (el.hasPointerCapture?.(event.pointerId)) {
                el.releasePointerCapture(event.pointerId);
            }
        };

        el.addEventListener("pointerup", release);
        el.addEventListener("pointercancel", release);
    });

    if (hero && finePointer && !reduceMotion && brandMark) {
        hero.addEventListener("pointermove", (event) => {
            const box = brandMark.getBoundingClientRect();
            const px = (event.clientX - box.left) / box.width - 0.5;
            const py = (event.clientY - box.top) / box.height - 0.5;
            brandMark.style.transform = `rotateY(${px * 6}deg) rotateX(${-py * 5}deg)`;
        }, { passive: true });

        hero.addEventListener("pointerleave", () => {
            brandMark.style.transform = "";
        });
    }

    brandSunHit?.addEventListener("click", () => {
        brandSunHit.classList.remove("is-boost");
        void brandSunHit.offsetWidth;
        brandSunHit.classList.add("is-boost");
        window.setTimeout(() => brandSunHit.classList.remove("is-boost"), 900);
    });

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.12, rootMargin: "0px 0px -30px 0px" }
    );

    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
})();
