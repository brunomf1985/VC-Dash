import { useState, useCallback } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Autocomplete, AutocompleteItem } from "@heroui/react";
import { Card, CardBody } from "@heroui/card";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
// Ícones simples inline para evitar dependências externas
const FilterIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707L14 14v6a1 1 0 01-1.447.894l-4-2A1 1 0 018 18v-4L1.293 7.293A1 1 0 011 6.586V4a1 1 0 011-1z" />
    </svg>
);

const CalendarIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
    </svg>
);

const XIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.3 5.71a.996.996 0 00-1.41 0L12 10.59 7.11 5.7A.996.996 0 105.7 7.11L10.59 12 5.7 16.89a.996.996 0 101.41 1.41L12 13.41l4.89 4.89a.996.996 0 101.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z" />
    </svg>
);
import { DateFilter } from "@/hooks/useDataFilter";

export interface FilterBarProps {
    onFilterChange: (filter: DateFilter) => void;
    currentFilter: DateFilter;
    availableMonths?: Array<{ key: string; label: string; date: Date }>;
    availableClients?: Array<{ key: string; label: string }>;
    className?: string;
}

export function FilterBar({
    onFilterChange,
    currentFilter,
    availableMonths = [],
    availableClients = [],
    className = ""
}: FilterBarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [tempFilter, setTempFilter] = useState<DateFilter>(currentFilter);
    const [validationErrors, setValidationErrors] = useState<{
        startDate?: boolean;
        endDate?: boolean;
    }>({});

    // Converter Date para string no formato YYYY-MM-DD
    const formatDateForInput = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    // Obter data mínima e máxima dos meses disponíveis
    const getDateLimits = () => {
        if (availableMonths.length === 0) {
            return { min: "", max: "" };
        }

        const sortedMonths = [...availableMonths].sort((a, b) => a.date.getTime() - b.date.getTime());
        return {
            min: formatDateForInput(sortedMonths[0].date),
            max: formatDateForInput(new Date(sortedMonths[sortedMonths.length - 1].date.getFullYear(),
                sortedMonths[sortedMonths.length - 1].date.getMonth() + 1, 0))
        };
    };

    const { min: minDate, max: maxDate } = getDateLimits();

    const handleApplyFilter = useCallback(() => {
        // Validação: verificar se as datas obrigatórias estão preenchidas
        const errors: { startDate?: boolean; endDate?: boolean } = {};
        
        if (!tempFilter.startDate) {
            errors.startDate = true;
        }
        if (!tempFilter.endDate) {
            errors.endDate = true;
        }
        
        setValidationErrors(errors);
        
        // Se há erros, não aplicar o filtro
        if (Object.keys(errors).length > 0) {
            console.log('⚠️ Campos obrigatórios não preenchidos:', errors);
            return;
        }
        
        // Limpar erros e aplicar filtro
        setValidationErrors({});
        onFilterChange(tempFilter);
        setIsOpen(false);
    }, [tempFilter, onFilterChange]);

    const handleClearFilter = useCallback(() => {
        const emptyFilter = { startDate: undefined, endDate: undefined, cliente: undefined };
        setTempFilter(emptyFilter);
        setValidationErrors({}); // Limpar erros de validação
        onFilterChange(emptyFilter);
        setIsOpen(false);
    }, [onFilterChange]);

    const handleQuickFilter = useCallback((months: number) => {
            // Se não há meses disponíveis (ainda não carregamos dados da API),
            // usar a data atual como referência para os filtros rápidos.
            // Isso permite que os botões rápidos funcionem antes do usuário
            // aplicar um filtro manual (útil para UX).
            const now = new Date();
            const sortedMonths = availableMonths && availableMonths.length > 0
                ? [...availableMonths].sort((a, b) => b.date.getTime() - a.date.getTime())
                : [{ date: now }];

            const endMonth = sortedMonths[0].date;
            const startMonth = new Date(endMonth.getFullYear(), endMonth.getMonth() - months + 1, 1);

            const filter = {
                startDate: formatDateForInput(startMonth),
                endDate: formatDateForInput(new Date(endMonth.getFullYear(), endMonth.getMonth() + 1, 0)),
                cliente: tempFilter.cliente // Preservar o cliente selecionado
            };

            setTempFilter(filter);
            onFilterChange(filter);
            setIsOpen(false);
    }, [availableMonths, onFilterChange, tempFilter.cliente]);

    const isFiltered = currentFilter.startDate || currentFilter.endDate || currentFilter.cliente;

    // Função para verificar se um filtro rápido está ativo
    const isQuickFilterActive = useCallback((months: number) => {
        if (!currentFilter.startDate || !currentFilter.endDate) return false;

        const now = new Date();
        const sortedMonths = availableMonths && availableMonths.length > 0
            ? [...availableMonths].sort((a, b) => b.date.getTime() - a.date.getTime())
            : [{ date: now }];

        const endMonth = sortedMonths[0].date;
        const startMonth = new Date(endMonth.getFullYear(), endMonth.getMonth() - months + 1, 1);

        const expectedStartDate = formatDateForInput(startMonth);
        const expectedEndDate = formatDateForInput(new Date(endMonth.getFullYear(), endMonth.getMonth() + 1, 0));

        return currentFilter.startDate === expectedStartDate && currentFilter.endDate === expectedEndDate;
    }, [currentFilter, availableMonths]);

    // Função para obter o texto do filtro ativo
    const getActiveFilterText = useCallback(() => {
        if (!isFiltered) return "Filtros";

        const parts: string[] = [];

        if (isQuickFilterActive(1)) parts.push("Último mês");
        else if (isQuickFilterActive(3)) parts.push("3 meses");
        else if (isQuickFilterActive(6)) parts.push("6 meses");
        else if (currentFilter.startDate || currentFilter.endDate) parts.push("Período");

        if (currentFilter.cliente) parts.push("Cliente");

        return parts.length > 0 ? parts.join(" + ") : "Filtros";
    }, [isFiltered, isQuickFilterActive, currentFilter.cliente, currentFilter.startDate, currentFilter.endDate]); return (
        <div className={className}>
            <Popover
                isOpen={isOpen}
                onOpenChange={setIsOpen}
                placement="bottom-start"
                shouldCloseOnInteractOutside={() => false}
            >
                <PopoverTrigger>
                    <Button
                        variant={isFiltered ? "solid" : "bordered"}
                        color={isFiltered ? "primary" : "default"}
                        startContent={<FilterIcon size={16} />}
                        endContent={isFiltered && <div className="w-2 h-2 bg-white/80 rounded-full" />}

                    >
                        {getActiveFilterText()}
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-80 z-50">
                    <Card className="shadow-none border-none">
                        <CardBody className="p-4">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-semibold text-lg">Filtros por Período</h4>
                                    <Button
                                        isIconOnly
                                        variant="light"
                                        size="sm"
                                        onPress={() => setIsOpen(false)}
                                    >
                                        <XIcon size={16} />
                                    </Button>
                                </div>

                                {/* Filtros rápidos */}
                                <div>
                                    <p className="text-sm font-medium mb-2">Filtros Rápidos:</p>
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            size="sm"
                                            variant={isQuickFilterActive(1) ? "solid" : "flat"}
                                            color={isQuickFilterActive(1) ? "primary" : "default"}
                                            onPress={() => handleQuickFilter(1)}
                                        >
                                            Último mês
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={isQuickFilterActive(3) ? "solid" : "flat"}
                                            color={isQuickFilterActive(3) ? "primary" : "default"}
                                            onPress={() => handleQuickFilter(3)}
                                        >
                                            3 meses
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={isQuickFilterActive(6) ? "solid" : "flat"}
                                            color={isQuickFilterActive(6) ? "primary" : "default"}
                                            onPress={() => handleQuickFilter(6)}
                                        >
                                            6 meses
                                        </Button>
                                    </div>
                                </div>


                                {/* Data de início */}
                                <div className="mt-10">
                                    <Input
                                        type="date"
                                        label="* Data de Início"
                                        labelPlacement="outside"
                                        value={tempFilter.startDate || ""}
                                        onValueChange={(value) => {
                                            setTempFilter(prev => ({ ...prev, startDate: value || undefined }));
                                            // Limpar erro quando o usuário preenche o campo
                                            if (value && validationErrors.startDate) {
                                                setValidationErrors(prev => ({ ...prev, startDate: false }));
                                            }
                                        }}
                                        min={minDate}
                                        max={maxDate}
                                        startContent={<CalendarIcon size={16} />}
                                        isInvalid={validationErrors.startDate}
                                        errorMessage={validationErrors.startDate ? "Data de início é obrigatória" : ""}
                                        classNames={{
                                            input: validationErrors.startDate ? "!border-red-500" : "",
                                            inputWrapper: validationErrors.startDate ? "!border-red-500" : ""
                                        }}
                                    />
                                </div>

                                {/* Data de fim */}
                                <div className="mt-10">
                                    <Input
                                        type="date"
                                        label="* Data de Fim"
                                        labelPlacement="outside"
                                        value={tempFilter.endDate || ""}
                                        onValueChange={(value) => {
                                            setTempFilter(prev => ({ ...prev, endDate: value || undefined }));
                                            // Limpar erro quando o usuário preenche o campo
                                            if (value && validationErrors.endDate) {
                                                setValidationErrors(prev => ({ ...prev, endDate: false }));
                                            }
                                        }}
                                        min={tempFilter.startDate || minDate}
                                        max={maxDate}
                                        startContent={<CalendarIcon size={16} />}
                                        isInvalid={validationErrors.endDate}
                                        errorMessage={validationErrors.endDate ? "Data de fim é obrigatória" : ""}
                                        classNames={{
                                            input: validationErrors.endDate ? "!border-red-500" : "",
                                            inputWrapper: validationErrors.endDate ? "!border-red-500" : ""
                                        }}
                                    />
                                </div>
                                {/* Informações do período disponível */}
                                {availableMonths.length > 0 && (
                                    <div className="text-xs text-gray-500">
                                        <p>Período disponível:</p>
                                        <p>
                                            {availableMonths[0].label} - {availableMonths[availableMonths.length - 1].label}
                                        </p>
                                    </div>
                                )}

                                {/* Filtro por Cliente */}
                                {availableClients.length > 0 && (
                                    <div>
                                        <Autocomplete
                                            label="Cliente"
                                            labelPlacement="outside"
                                            placeholder="Selecione um cliente"
                                            selectedKey={tempFilter.cliente}
                                            onSelectionChange={(selected) => {
                                                setTempFilter(prev => ({ ...prev, cliente: selected as string || undefined }));
                                            }}
                                            allowsCustomValue={false}
                                            size="sm"
                                            listboxProps={{
                                                emptyContent: "Nenhum cliente encontrado"
                                            }}
                                            menuTrigger="input"
                                        >
                                            {availableClients.map((client) => (
                                                <AutocompleteItem key={client.key}>
                                                    {client.label}
                                                </AutocompleteItem>
                                            ))}
                                        </Autocomplete>
                                    </div>
                                )}

                                {/* Botões de ação */}
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        color="primary"
                                        onPress={handleApplyFilter}
                                        className="flex-1"
                                    >
                                        Aplicar
                                    </Button>
                                    <Button
                                        variant="flat"
                                        onPress={handleClearFilter}
                                        className="flex-1"
                                    >
                                        Limpar
                                    </Button>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </PopoverContent>
            </Popover>
        </div>
    );
}