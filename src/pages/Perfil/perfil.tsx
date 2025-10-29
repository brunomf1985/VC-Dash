import React from 'react';
import {
  Card,
  CardBody,
  Avatar,
  Tabs,
  Tab,
  // Removi o Input, pois não está sendo usado nesta parte
} from '@heroui/react';
import {
  MailIcon,
  PhoneIcon,
  BuildingIcon,
  CalendarDaysIcon,
} from 'lucide-react';

import DefaultLayout from '@/layouts/default';
import { PageTransition } from '@/components/PageTransiotion';
import { motion, AnimatePresence } from "framer-motion";

// --- Mock de dados do usuário logado ---
const loggedInUser = {
  name: 'Administrativo Granito Boneli',
  email: 'adm@granitoboneli.com.br',
  role: 'Administrativo',
  phone: '(19) 3212-1298',
  company: 'Granito Boneli',
  memberSince: 'Julho de 2025',
};
// ----------------------------------------

const Perfil = () => {
  return (
    <DefaultLayout>
      <PageTransition>
        <section className="flex flex-col w-full gap-6 py-8 md:py-1">
          {/* Header */}
          <div className="w-full text-start mb-2">
            <h1 className="text-3xl font-bold text-foreground">
              Login/Usuário
            </h1>
            <p className="text-default-400 px-4 py-2 rounded-lg mt-2 inline-block">
              Gerencie suas informações pessoais e configurações de conta
            </p>
          </div>

          {/* Tabs de Navegação E CONTEÚDO 
            O conteúdo de cada aba agora está DENTRO da tag <Tab>
          */}
          <Tabs
            aria-label="Navegação do Perfil"
            defaultSelectedKey="perfil"
            variant="underlined"
            className="w-full" // Ocupa a largura total
            classNames={{
              // ADICIONE ISSO:
              tabList: "w-full justify-center",
            }}
          >
            {/* Aba de Perfil com seu conteúdo */}
            <Tab key="perfil" title="Perfil">
              <AnimatePresence mode="wait">
                <motion.div
                  key="perfil" // chave única por aba
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                >
                  {/* Conteúdo Principal - Duas Colunas */}
                  <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
                    {/* Coluna da Esquerda (Perfil) */}
                    <div className="lg:col-span-1">
                      <Card className="h-full bg-transparent border border-default-200 shadow-sm">
                        <CardBody className="flex flex-col items-center p-8 space-y-4">
                          <Avatar
                            name="Granito Boneli"
                            className="w-24 h-24 text-3xl mb-2"
                          />
                          <h2 className="text-xl font-semibold">
                            {loggedInUser.name}
                          </h2>
                          <div className="text-sm text-default-500 flex items-center gap-2">
                          </div>
                          <div className="w-full text-left space-y-4 pt-6">
                            <div className="flex items-center gap-3">
                              <MailIcon size={18} className="text-default-500" />
                              <span className="text-sm">{loggedInUser.email}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <PhoneIcon size={18} className="text-default-500" />
                              <span className="text-sm">{loggedInUser.phone}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <BuildingIcon
                                size={18}
                                className="text-default-500"
                              />
                              <span className="text-sm">
                                {loggedInUser.company}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <CalendarDaysIcon
                                size={18}
                                className="text-default-500"
                              />
                              <span className="text-sm">
                                Membro desde {loggedInUser.memberSince}
                              </span>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    </div>

                    {/* Coluna da Direita (Detalhes) */}
                    <div className="lg:col-span-2">
                      <Card className="h-full bg-transparent border border-default-200 shadow-sm">
                        <CardBody className="p-8 space-y-6">
                          <div>
                            <h3 className="text-xl font-semibold">
                              Informações Pessoais
                            </h3>
                            <p className="text-default-500 text-sm">
                              Visualize suas informações pessoais
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10 pt-2">

                            <div className="border-b border-default-200 pb-2">
                              <label className="text-xs font-medium text-default-500">
                                Nome Completo
                              </label>
                              <p className="text-sm text-foreground pt-1">
                                {loggedInUser.name}
                              </p>
                            </div>

                            <div className="border-b border-default-200 pb-2">
                              <label className="text-xs font-medium text-default-500">
                                Email
                              </label>
                              <p className="text-sm text-foreground pt-1">
                                {loggedInUser.email}
                              </p>
                            </div>

                            <div className="border-b border-default-200 pb-2">
                              <label className="text-xs font-medium text-default-500">
                                Telefone
                              </label>
                              <p className="text-sm text-foreground pt-1">
                                {loggedInUser.phone}
                              </p>
                            </div>

                            <div className="border-b border-default-200 pb-2">
                              <label className="text-xs font-medium text-default-500">
                                Empresa
                              </label>
                              <p className="text-sm text-foreground pt-1">
                                {loggedInUser.company}
                              </p>
                            </div>

                          </div>
                        </CardBody>
                      </Card>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </Tab>

            {/* Aba de Configurações com seu conteúdo */}
            <Tab key="configuracoes" title="Configurações">
              <AnimatePresence mode="wait">
                <motion.div
                  key="configuracoes"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                >
                  <Card className="mt-4 bg-transparent border border-default-200 shadow-sm">
                    <CardBody>
                      <h3 className="text-xl font-semibold">
                        Configurações da Conta
                      </h3>
                      <p className="text-default-500 text-sm mt-2">
                        Aqui você poderá adicionar as opções de configuração, como
                        mudar senha, etc.
                      </p>
                    </CardBody>
                  </Card>
                </motion.div>
              </AnimatePresence>
            </Tab>
          </Tabs>
          {/* O CONTEÚDO ANTIGO FOI REMOVIDO DAQUI */}
        </section>
      </PageTransition>
    </DefaultLayout>
  );
}

export default Perfil;