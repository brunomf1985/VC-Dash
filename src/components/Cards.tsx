import React from 'react';
import { Card } from "@heroui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Progress } from '@heroui/progress';
import { NumberTicker } from './ui/number-ticker';
import { useWatchTheme } from '@/hooks/WatchTheme';

interface PositiveColorClasses {
    card: string;
    text: string;
    icon: string;
    shadowHoverClass: string;
    progressColor: string;
}

export interface CardsProps {
    title: string;
    subtitle?: string;
    value: number;
    meta: number;
    isPositive?: boolean;
    Icon: React.ElementType;
    colors: PositiveColorClasses;
    description: string;
    showProgress?: boolean;
    showMeta: boolean;
    showSubTitle?: boolean;
    showDescription?: boolean;
    prefix?: string;
    suffix?: string;
}

export default function Cards({ title, subtitle, value, Icon, meta, isPositive, colors, showProgress = false, showMeta = true, showDescription = false, description, prefix = "", suffix = "" }: CardsProps) {

    const behaviorClasses = "transition-all duration-150 hover:-translate-y-1 shadow-md hover:shadow-lg";
    const { isDarkMode } = useWatchTheme();

    const negativeColors = {
        card: "p-4 bg-[#f1d8d8] dark:bg-gradient-to-br from-[#420000] to-[#6d2525]",
        text: "text-sm text-red-700 dark:text-red-300",
        icon: "text-red-500",
        titleText: "text-sm text-red-500 dark:text-red-300",
        subTitleText: "text-xs text-red-700 dark:text-red-300",
        valueText: "text-3xl font-bold text-red-500 dark:text-red-300",
        descriptionText: isDarkMode ? "text-md text-gray-400" : "text-md text-gray-500",
        metaText: "text-red-700 dark:text-red-300",
        shadowHoverClass: "dark:hover:shadow-red-500/50"
    };

    const positiveColors = {
        card: colors.card,
        text: colors.text,
        icon: colors.icon,
        titleText: `text-sm ${colors.text}`,
        subTitleText: `text-xs ${colors.text}`,
        descriptionText: isDarkMode ? 'text-md text-gray-400' : 'text-md text-gray-500',
        valueText: `${colors.text.replace('text-sm', 'text-3xl font-bold')} dark:text-current`,
        metaText: colors.text,
        shadowHoverClass: colors.shadowHoverClass
    };

    const currentColors = isPositive ? positiveColors : negativeColors;
    const cardClassName = `${currentColors.card} ${behaviorClasses} ${currentColors.shadowHoverClass}`;
    const progressValue = meta > 0 ? Math.min((value / meta) * 100, 100) : 0;
    const standardProgressColors = ["success", "primary", "secondary", "warning", "danger"];
    const activeProgressColor = isPositive ? colors.progressColor : "danger";
    const progressProps = standardProgressColors.includes(activeProgressColor)
        ? { color: activeProgressColor as "success" | "danger" | "primary" }
        : { classNames: { indicator: activeProgressColor } };

    return (
        <Card className={cardClassName}>
            <div className="flex justify-between items-center mb-2">
                <div className='grid grid-cols-2 md:grid-cols-1'>
                    <p className={currentColors.titleText}>{title}</p>
                    <p className={currentColors.subTitleText}>{subtitle}</p>
                </div>
                <Icon className={currentColors.icon} size={20} />
            </div>
            <div className={`${currentColors.valueText} flex items-baseline whitespace-pre-wrap`}>
                {prefix && <span>{prefix}</span>}
                <NumberTicker value={value} decimalPlaces={2} className={currentColors.valueText} />
                {suffix && <span>{suffix}</span>}
            </div>

            {showMeta && (

                <div className={`text-xs flex items-center ${currentColors.metaText}`}>
                    {isPositive ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                    Meta: {prefix}{meta.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{suffix}
                </div>
            )
            }
            {showDescription && (
                <div className='mt-1'>
                    <p className={currentColors.descriptionText}>{description}</p>
                </div>
            )}
            {showProgress && (
                <Progress
                    aria-label={title}
                    size="sm"
                    value={progressValue}
                    className="mt-2"
                    {...progressProps}
                />
            )}
        </Card>
    );
}