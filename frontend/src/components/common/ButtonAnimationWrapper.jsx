import { motion } from "framer-motion";

export default function ButtonAnimationWrapper({ children, className }) {
    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={className}
            style={{ display: "inline-block" }}
        >
            {children}
        </motion.div>
    );
}
