#pragma once
#include "Global.h"

DWORD WINAPI ResponseServer(LPVOID pPrm)
{
    DWORD rc = 0;
    SOCKET ServerSocket;
    WSADATA wsaData;
    cout << "ResponseServer started on port " << uport << ";\n" << endl;

    try
    {
        if (WSAStartup(MAKEWORD(2, 0), &wsaData) != 0)
            throw SetErrorMsgText("Startup:", WSAGetLastError());

        SOCKADDR_IN From = { AF_UNSPEC };
        int Flen = sizeof(From);
        SOCKADDR_IN serv;
        serv.sin_family = AF_INET;
        serv.sin_port = htons(uport);
        serv.sin_addr.s_addr = INADDR_ANY;

        if ((ServerSocket = socket(AF_INET, SOCK_DGRAM, 0)) == INVALID_SOCKET)
            throw SetErrorMsgText("Socket:", WSAGetLastError());

        
        int broadcast = 1;
        if (setsockopt(ServerSocket, SOL_SOCKET, SO_BROADCAST,
            (char*)&broadcast, sizeof(broadcast)) == SOCKET_ERROR)
            cout << "Warning: Cannot set broadcast option" << endl;

        u_long nonblk = 1;
        if (ioctlsocket(ServerSocket, FIONBIO, &nonblk) == SOCKET_ERROR)
            throw SetErrorMsgText("Ioctlsocket:", WSAGetLastError());

        if (bind(ServerSocket, (LPSOCKADDR)&serv, sizeof(serv)) == SOCKET_ERROR)
            throw SetErrorMsgText("Bind:", WSAGetLastError());

        cout << "ResponseServer: Waiting for broadcast messages...\n" << endl;

        while (*((TalkersCmd*)pPrm) != Exit)
        {
            char ibuf[50];
            int libuf = 0;
            bool result = false;

            if ((libuf = recvfrom(ServerSocket, ibuf, sizeof(ibuf), 0,
                (LPSOCKADDR)&From, &Flen)) == SOCKET_ERROR)
            {
                switch (WSAGetLastError())
                {
                case WSAEWOULDBLOCK:
                    SleepEx(10, TRUE);
                    break;
                default:
                    throw SetErrorMsgText("Recv:", WSAGetLastError());
                }
            }
            else
            {
                result = true;
                
                if (libuf > 0) {
                    ibuf[libuf] = '\0';
                }
            }

            if (libuf > 0 && result == true)
            {
                // что получили
                cout << "ResponseServer: Received from "
                    << inet_ntoa(From.sin_addr)
                    << " message: \"" << ibuf << "\"" << endl;

                if (strcmp(ibuf, ucall) == 0)
                {
                    cout << "ResponseServer: Sending response to "
                        << inet_ntoa(From.sin_addr) << endl;

                    // sendto
                    if ((libuf = sendto(ServerSocket, ucall, strlen(ucall) + 1, 0,
                        (LPSOCKADDR)&From, Flen)) == SOCKET_ERROR)  // ← Flen!
                        throw SetErrorMsgText("Sendto:", WSAGetLastError());

                    cout << "ResponseServer: Response sent\n" << endl;
                }
            }
        }

        if (closesocket(ServerSocket) == SOCKET_ERROR)
            throw SetErrorMsgText("Closesocket:", WSAGetLastError());
        if (WSACleanup() == SOCKET_ERROR)
            throw SetErrorMsgText("Cleanup:", WSAGetLastError());
    }
    catch (string errorMsgText)
    {
        cout << errorMsgText << endl;
    }
    cout << "ResponseServer stopped;\n" << endl;
    ExitThread(rc);
}