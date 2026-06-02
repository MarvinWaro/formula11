type Props = {
    className?: string;
};

export default function AppLogoIcon({ className }: Props) {
    return <img src="/assets/img/logo-circle.png" alt="Logo" className={className} />;
}
