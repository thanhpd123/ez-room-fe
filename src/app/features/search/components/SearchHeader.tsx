interface SearchHeaderProps {
    title?: string;
    subtitle?: string;
}

export function SearchHeader({
    title = 'Tìm kiếm phòng trọ',
    subtitle = 'Tìm ngôi nhà lý tưởng cho bạn với công nghệ tìm kiếm thông minh',
}: SearchHeaderProps) {
    return (
        <header className="bg-card shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <h1 className="text-center text-foreground">{title}</h1>
                <p className="text-center text-foreground/60 mt-2">{subtitle}</p>
            </div>
        </header>
    );
}
