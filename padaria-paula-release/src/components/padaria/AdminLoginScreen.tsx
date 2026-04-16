'use client';

// AdminLoginScreen - Padaria Paula
// Tela de login com PIN para acessar administração
// Layout idêntico ao login principal do app

import { useState, useEffect, useRef } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAdminStore } from '@/store/useAdminStore';
import { useToast } from '@/hooks/use-toast';

interface AdminLoginScreenProps {
  onLoginSuccess: () => void;
}

export default function AdminLoginScreen({ onLoginSuccess }: AdminLoginScreenProps) {
  const { login } = useAdminStore();
  const { toast } = useToast();

  const [senha, setSenha] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focar no primeiro input ao carregar
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Handler para cada dígito
  const handleInputChange = (index: number, value: string) => {
    // Permitir apenas números
    if (value && !/^\d$/.test(value)) return;

    const novaSenha = [...senha];
    novaSenha[index] = value;
    setSenha(novaSenha);

    // Se digitou, foca no próximo
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Se completou todos os dígitos, tenta logar automaticamente
    if (novaSenha.every(d => d !== '') && novaSenha.join('').length === 4) {
      handleLogin(novaSenha.join(''));
    }
  };

  // Handler para teclas (backspace, etc)
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !senha[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handler para colar
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);

    if (pastedData) {
      const novaSenha = pastedData.split('').concat(['', '', '', '']).slice(0, 4);
      setSenha(novaSenha);

      // Se colou 4 dígitos, tenta logar
      if (pastedData.length === 4) {
        handleLogin(pastedData);
      }
    }
  };

  // Login
  const handleLogin = async (senhaCompleta?: string) => {
    const senhaFinal = senhaCompleta || senha.join('');

    if (senhaFinal.length !== 4) {
      toast({
        title: 'Senha incompleta',
        description: 'Digite os 4 dígitos da senha.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const sucesso = await login(senhaFinal);

      if (sucesso) {
        toast({
          title: 'Acesso autorizado',
          description: 'Bem-vindo à área administrativa!',
        });
        onLoginSuccess();
      } else {
        toast({
          title: 'Senha incorreta',
          description: 'A senha informada está incorreta.',
          variant: 'destructive',
        });
        setSenha(['', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Erro no login:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível verificar a senha.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-sm card-padaria">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Área Administrativa</CardTitle>
          <CardDescription className="flex items-center justify-center gap-2 mt-2">
            <Lock className="w-4 h-4" />
            Digite a senha para acessar
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="flex justify-center gap-3 mb-6">
            {[0, 1, 2, 3].map((index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={senha[index]}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                disabled={loading}
                className="w-14 h-16 text-center text-2xl font-bold
                         border-2 border-input rounded-lg
                         bg-background focus:border-primary focus:ring-2 focus:ring-primary/20
                         outline-none transition-all
                         disabled:opacity-50"
              />
            ))}
          </div>

          <Button
            onClick={() => handleLogin()}
            disabled={loading || senha.some(d => !d)}
            className="w-full btn-padaria h-12 text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 mr-2" />
                Entrar
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground mt-6 text-center absolute bottom-4">
        Digite os 4 dígitos da senha administrativa
      </p>
    </div>
  );
}
