import React from "react";

const GradientButton = ({
  children,
  onClick,
  className = "",
  colors = {
    glowStart: "#fff",
    glowEnd: "#ff9b26",
    gradientStart: "#ff0c00",
    gradientEnd: "#fd8925",
  },
}) => {
  return (
    <>
      <style>
        {`
          @property --bg-color-1 { syntax: "<color>"; inherits: true; initial-value: transparent }
          @property --bg-color-2 { syntax: "<color>"; inherits: true; initial-value: transparent }
          @property --bg-color-3 { syntax: "<color>"; inherits: true; initial-value: transparent }
          @property --bg-color-4 { syntax: "<color>"; inherits: true; initial-value: transparent }
          @property --bg-stop-1 { syntax: "<percentage>"; inherits: true; initial-value: 0 }
          @property --bg-stop-2 { syntax: "<percentage>"; inherits: true; initial-value: 100% }
          @property --gradient-glow-x { syntax: "<percentage>"; initial-value: 100%; inherits: false }
          @property --gradient-glow-y { syntax: "<percentage>"; initial-value: 50%; inherits: false }

          @keyframes gradient-glow {
            0% { --gradient-glow-x: 100%; --gradient-glow-y: 50% }
            5% { --gradient-glow-x: 100%; --gradient-glow-y: 100% }
            20% { --gradient-glow-x: 0%; --gradient-glow-y: 100% }
            25% { --gradient-glow-x: 0%; --gradient-glow-y: 50% }
            30% { --gradient-glow-x: 0%; --gradient-glow-y: 0% }
            45% { --gradient-glow-x: 100%; --gradient-glow-y: 0% }
            50% { --gradient-glow-x: 100%; --gradient-glow-y: 50% }
          }

          .btn-cta {
            overflow: hidden;
            --gradient-glow-x: 100%;
            --gradient-glow-y: 50%;
            --bg-color-1: hsla(0, 0%, 100%, 0);
            --bg-color-2: ${colors.glowEnd};
            --bg-color-3: ${colors.gradientStart};
            --bg-color-4: ${colors.gradientEnd};
            --bg-stop-1: 100%;
            --bg-stop-2: 150%;
            background: radial-gradient(5rem 80% at var(--gradient-glow-x) var(--gradient-glow-y), ${colors.glowStart}, ${colors.glowEnd} 90%),
                      radial-gradient(5rem 80% at 100% 50%, ${colors.glowStart}, ${colors.glowEnd} 90%);
            transition-duration: .45s;
            transition-property: --gradient-glow-x, --gradient-glow-y, --bg-color-1, --bg-color-2, --bg-stop-1, --bg-stop-2;
            animation: gradient-glow 5s linear infinite;
          }

          .btn-cta span {
            position: relative;
            z-index: 10;
          }

          .btn-cta:before {
            border-radius: .5rem;
            content: "";
            top: 1px;
            right: 1px;
            bottom: 1px;
            left: 1px;
            pointer-events: none;
            position: absolute;
            background: linear-gradient(225deg, var(--bg-color-3), var(--bg-color-4));
            z-index: 1;
          }

          .btn-cta:after {
            border-radius: .5rem;
            content: "";
            top: 1px;
            right: 1px;
            bottom: 1px;
            left: 1px;
            pointer-events: none;
            position: absolute;
            z-index: 2;
            --tw-blur: blur(5px);
            background: linear-gradient(to bottom, var(--bg-color-1) var(--bg-stop-1), var(--bg-color-2) var(--bg-stop-2), transparent 100%);
            filter: var(--tw-blur);
          }

          .btn-cta:hover {
            --bg-stop-1: -20%;
            --bg-stop-2: 0%;
          }
        `}
      </style>

      <button
        className={`btn-cta relative flex items-center justify-center text-white text-center overflow-hidden rounded-lg px-4 py-2 ${className}`}
        onClick={onClick}
      >
        <span className="whitespace-nowrap">{children}</span>
      </button>
    </>
  );
};

export default GradientButton;
